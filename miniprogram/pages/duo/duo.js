const app = getApp();
const Player = require('../../utils/player');
const RoomSync = require('../../utils/room-sync');
const RoomMap = require('../../utils/room-map');
const Layout = require('../../utils/room-layout');
const RecordsUtil = require('../../utils/records');

Page({
  data: {
    peer: 'KIKI',
    peerColor: '#F5B83D',
    me: {},
    sync: 98,
    statusBarH: 20,
    player: { left: 40, top: 72, walking: false, direction: 'right' },
    playerSprite: 'idle',
    playerScale: 0.98,
    playerZ: 720,
    peerSprite: 'idle',
    peerScale: 0.907,
    peerZ: 620,
    peerPosition: { left: 52, top: 62 },
    interaction: '',
    layers: [],
    recordSlots: []
  },

  syncTimer: null,
  playerBeat: null,
  unsubPlayer: null,
  lastBroadcast: null,
  // 自动播放还原：仅当本次进入由我们"代为开播"且用户没手动碰过控制时才还原
  autoStarted: false,
  userTouched: false,
  moveTimer: null,
  peerTimer: null,

  onLoad(options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const peerColors = { KIKI: '#F5B83D', NANA: '#7FB5E8', ABO: '#E8734A', RITA: '#C9CDD4', TAO: '#C9CDD4' };
    const peer = options.peer || 'KIKI';
    this.setData({
      peer,
      peerColor: peerColors[peer] || '#F5B83D',
      me: app.globalData.user,
      statusBarH: info.statusBarHeight || 20
    });
    if (!Player.snapshot().playing) {
      Player.play();
      this.autoStarted = true;
    }
    this.refreshRoomConfig();
    // 播放状态广播：本地操作（切歌/播放暂停/seek 跳变）即时报，对端 remote 应用不回播
    this.unsubPlayer = Player.subscribe((snap, source) => this.onPlayerSnap(snap, source));
  },

  // DIY 状态 → 场景（与房间页同源，只读展示）
  refreshRoomConfig() {
    const room = app.globalData.room || {};
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    RoomMap.setActiveFurniture(keys);
    const layers = Layout.FURNITURE
      .filter((f) => keys.includes(f.key))
      .map((f) => ({ key: f.key, src: f.overlay, z: f.z }));
    const selected = RecordsUtil.readSelection((k) => wx.getStorageSync(k));
    const recordSlots = Layout.RECORD_SLOTS.slice(0, selected.length)
      .map((slot, i) => ({ ...slot, key: `slot-${i}`, src: `/assets/img/rec-${selected[i]}.webp` }));
    this.setData({ layers, recordSlots });
  },

  onPlayerSnap(snap, source) {
    if (source === 'remote') return;
    const last = this.lastBroadcast;
    const jumped = last ? Math.abs(snap.position - last.position) > 3 : false;
    if (!last || snap.index !== last.index || snap.playing !== last.playing || jumped) {
      RoomSync.sendPlayer({ index: snap.index, position: snap.position, playing: snap.playing });
    }
    this.lastBroadcast = { index: snap.index, playing: snap.playing, position: snap.position };
  },

  doJoin() {
    RoomSync.join({
      room: app.globalData.user.roomId,
      name: app.globalData.user.name,
      peerBase: { ...this.data.peerPosition },
      handlers: {
        onPeerMove: (msg) => this.animatePeer(msg),
        onPeerPlayer: (msg) => Player.applyRemote(msg),
        onPeerAction: (msg) => this.setData({ interaction: msg.label }),
        onPeerJoin: (msg) => this.setData({ interaction: `${msg.from} 进入了房间` }),
        onPeerLeave: (msg) => this.setData({ interaction: `${msg.from} 离开了` })
      }
    });
  },

  // peer 位置平滑插值（信任对端路径，不做碰撞）
  animatePeer(msg) {
    const start = this.data.peerPosition;
    const steps = 14;
    let step = 0;
    if (this.peerTimer) clearInterval(this.peerTimer);
    this.peerTimer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const done = step >= steps;
      const top = start.top + (msg.top - start.top) * ratio;
      const depth = RoomMap.depthFor(top);
      this.setData({
        peerPosition: {
          left: start.left + (msg.left - start.left) * ratio,
          top
        },
        peerScale: depth.scale,
        peerZ: depth.z,
        peerSprite: done ? 'idle' : (step % 2 === 0 ? 'walk-a' : 'walk-b')
      });
      if (done) {
        clearInterval(this.peerTimer);
        this.peerTimer = null;
      }
    }, 40);
  },

  onShow() {
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => {
        this.setData({ sync: 95 + Math.floor(Math.random() * 5) });
      }, 5000);
    }
    // 播放进度心跳：每 5s 向房间广播一次，对端按 2.5s 容差校正
    if (!this.playerBeat) {
      this.playerBeat = setInterval(() => {
        const snap = Player.snapshot();
        if (snap.playing && RoomSync.isOnline()) {
          RoomSync.sendPlayer({ index: snap.index, position: snap.position, playing: snap.playing });
          this.lastBroadcast = { index: snap.index, playing: snap.playing, position: snap.position };
        }
      }, 5000);
    }
    // 连接恢复只放在 onShow，避免 onLoad/onShow 重复 join
    if (!RoomSync.isOnline()) this.doJoin();
  },

  onStageTap(e) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.duo-stage').boundingClientRect((rect) => {
      if (!rect) return;
      const left = ((e.detail.x - rect.left) / rect.width) * 100;
      const top = ((e.detail.y - rect.top) / rect.height) * 100;
      const next = RoomMap.resolveTarget(this.data.player, { left, top });
      this.moveAlongPath(this.data.player, next);
      const dx = next.left - this.data.peerPosition.left;
      const dy = next.top - this.data.peerPosition.top;
      if (Math.sqrt(dx * dx + dy * dy) < 18) this.setData({ interaction: '靠近了 KIKI，点击对方头像互动' });
    }).exec();
  },

  moveAlongPath(start, target) {
    const path = RoomMap.findPath(start, target);
    const walkNext = (index) => {
      if (index >= path.length) return;
      const point = path[index];
      this.animatePlayer(point.left, point.top, () => walkNext(index + 1));
    };
    walkNext(0);
  },

  animatePlayer(left, top, onComplete) {
    if (this.moveTimer) clearInterval(this.moveTimer);
    const start = this.data.player;
    const distance = Math.sqrt(Math.pow(left - start.left, 2) + Math.pow(top - start.top, 2));
    const steps = Math.max(8, Math.ceil(distance * 2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    this.setData({ 'player.walking': true, 'player.direction': direction, playerSprite: 'walk-a' });
    this.moveTimer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const next = {
        left: start.left + (left - start.left) * ratio,
        top: start.top + (top - start.top) * ratio
      };
      if (RoomMap.isBlocked(next)) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ 'player.walking': false, playerSprite: 'idle' });
        wx.showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      const depth = RoomMap.depthFor(next.top);
      this.setData({
        player: { left: next.left, top: next.top, walking: true, direction },
        playerSprite: step % 2 === 0 ? 'walk-a' : 'walk-b',
        playerScale: depth.scale,
        playerZ: depth.z
      });
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ 'player.walking': false, playerSprite: 'idle' });
        if (onComplete) onComplete();
      }
    }, 30);
  },

  onPeerTap() {
    wx.showActionSheet({ itemList: ['挥手', '击掌', '邀请一起听歌'], success: (res) => {
      const labels = ['你向 KIKI 挥了挥手', '你和 KIKI 击掌了', '你们开始一起听歌'];
      this.setData({ interaction: labels[res.tapIndex] });
      RoomSync.sendAction(labels[res.tapIndex]);
      wx.showToast({ title: labels[res.tapIndex], icon: 'none' });
    } });
  },

  onHide() {
    this.stopSyncTimer();
    RoomSync.leave();
  },

  onUnload() {
    this.stopSyncTimer();
    RoomSync.leave();
    if (this.playerBeat) {
      clearInterval(this.playerBeat);
      this.playerBeat = null;
    }
    if (this.unsubPlayer) {
      this.unsubPlayer();
      this.unsubPlayer = null;
    }
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.peerTimer) clearInterval(this.peerTimer);
    // 还原：进入前是暂停、且用户在房间里没主动操作过播放器 → 退出时恢复暂停
    if (this.autoStarted && !this.userTouched && Player.snapshot().playing) {
      Player.toggle();
    }
  },

  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  },

  // mini-player 的控制事件：标记用户主动操作过，退出时不还原播放状态
  onPlayerControl() {
    this.userTouched = true;
  },

  onBack() {
    wx.navigateBack();
  },

  onExit() {
    wx.showModal({
      title: '退出双人放映？',
      content: `${this.data.peer} 会继续留在房间里听歌`,
      confirmText: '退出',
      confirmColor: '#E8734A',
      success: (res) => {
        if (res.confirm) wx.navigateBack();
      }
    });
  }
});
