const app = getApp();
const Player = require('../../utils/player');
const RoomSync = require('../../utils/room-sync');
const RoomMap = require('../../utils/room-map');
const SceneLayout = require('../../utils/room-scene-layout');
const RecordsUtil = require('../../utils/records');

// 与 room 页同一套 Master 几何与碰撞(单一数据源);独立实例持有自己的 activeFurniture 状态
const map = RoomMap.createMap(SceneLayout.GEOMETRY, SceneLayout);

Page({
  data: {
    peer: 'KIKI',
    peerColor: '#F5B83D',
    me: {},
    sync: 98,
    statusBarH: 20,
    // Room Master Scene 输入(room-scene 组件属性)
    floor: 'blue-gray',
    lightTemp: 2700,
    furnitureKeys: [],
    recordIds: [],
    characters: [],
    lampOn: true,
    projectorOn: false,
    nowPlaying: { playing: false, title: '' },
    bubbles: [],
    // 角色逻辑状态(页面持有)
    player: { left: 40, top: 72, direction: 'right' },
    playerSprite: 'idle',
    peerPosition: { left: 52, top: 62 },
    peerSprite: 'idle',
    peerDirection: 'left'
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
    this.refreshScene();
    this.syncCharacters();
    // 播放状态广播：本地操作（切歌/播放暂停/seek 跳变）即时报，对端 remote 应用不回播
    this.unsubPlayer = Player.subscribe((snap, source) => this.onPlayerSnap(snap, source));
  },

  // DIY 状态 → 场景（与房间页同一份 roomie_room / roomie_records，只读）
  refreshScene() {
    const room = app.globalData.room || {};
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    map.setActiveFurniture(keys);
    const snap = Player.snapshot();
    this.setData({
      furnitureKeys: keys.slice(),
      floor: room.floor || 'blue-gray',
      lightTemp: room.lightTemp || 2700,
      recordIds: RecordsUtil.readSelection((k) => wx.getStorageSync(k)).slice(),
      nowPlaying: { playing: snap.playing, title: snap.track.title }
    });
  },

  // 页面逻辑状态 → 组件渲染快照
  syncCharacters() {
    const { player, playerSprite, peerPosition, peerSprite, peerDirection, peer, me } = this.data;
    this.setData({
      characters: [
        { id: 'momo', x: player.left, y: player.top, frame: playerSprite, facing: player.direction === 'left' ? -1 : 1, label: me.name || '我' },
        { id: 'kiki', x: peerPosition.left, y: peerPosition.top, frame: peerSprite, facing: peerDirection === 'left' ? -1 : 1, label: peer }
      ]
    });
  },

  onPlayerSnap(snap, source) {
    this.setData({ nowPlaying: { playing: snap.playing, title: snap.track.title } });
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
        onPeerAction: (msg) => this.flashBubble(msg.label),
        onPeerJoin: (msg) => this.flashBubble(`${msg.from} 进入了房间`),
        onPeerLeave: (msg) => this.flashBubble(`${msg.from} 离开了`)
      }
    });
  },

  // peer 位置平滑插值（信任对端路径，不做碰撞）
  animatePeer(msg) {
    const start = this.data.peerPosition;
    const steps = 14;
    let step = 0;
    if (this.peerTimer) clearInterval(this.peerTimer);
    const direction = msg.direction || (msg.left < start.left ? 'left' : 'right');
    this.peerTimer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const done = step >= steps;
      this.setData({
        peerPosition: {
          left: start.left + (msg.left - start.left) * ratio,
          top: start.top + (msg.top - start.top) * ratio
        },
        peerDirection: direction,
        peerSprite: done ? 'idle' : (step % 2 === 0 ? 'walk-a' : 'walk-b')
      });
      this.syncCharacters();
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

  onSceneTap(e) {
    if (!e.detail || typeof e.detail.left !== 'number') return;
    const next = map.resolveTarget(this.data.player, e.detail);
    this.moveAlongPath(this.data.player, next);
    const dx = next.left - this.data.peerPosition.left;
    const dy = next.top - this.data.peerPosition.top;
    if (Math.sqrt(dx * dx + dy * dy) < 18) this.flashBubble(`靠近了 ${this.data.peer}，点击对方互动`);
  },

  // 双人房家具热点:灯光/放映机即时生效,其余给轻量反馈(不写房间状态机)
  onFurnitureTap(e) {
    const id = e.detail.id;
    const flavor = {
      'record-wall': `唱片墙:已挂 ${this.data.recordIds.length} 张收藏 · 正在播《${this.data.nowPlaying.title}》`,
      turntable: '黑胶在转,别停',
      sofa: '沙发留给你们俩',
      guitar: `${this.data.peer} 最喜欢这一段 Riff`,
      'floor-records': '地面的唱片是昨晚没放完的'
    };
    if (id === 'lamp') {
      this.setData({ lampOn: !this.data.lampOn });
      this.flashBubble(this.data.lampOn ? '落地灯已打开' : '落地灯已关闭 · 投影光更清晰');
      return;
    }
    if (id === 'projector') {
      this.setData({ projectorOn: !this.data.projectorOn });
      this.flashBubble(this.data.projectorOn ? '放映机已打开 · 房间进入观影模式' : '放映机已关闭');
      return;
    }
    if (flavor[id]) this.flashBubble(flavor[id]);
  },

  flashBubble(text) {
    const bubbles = [{ id: 'interaction', x: 50, y: 88, text, kind: 'info' }];
    this.setData({ bubbles });
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => this.setData({ bubbles: [] }), 2600);
  },

  moveAlongPath(start, target) {
    const path = map.findPath(start, target);
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
    const distance = map.distance(start, { left, top });
    const steps = Math.max(8, Math.ceil(distance * 2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    this.setData({ playerSprite: 'walk-a' });
    this.moveTimer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const next = {
        left: start.left + (left - start.left) * ratio,
        top: start.top + (top - start.top) * ratio
      };
      if (map.isBlocked(next)) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ playerSprite: 'idle' });
        this.syncCharacters();
        wx.showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      this.setData({
        player: { left: next.left, top: next.top, direction },
        playerSprite: step % 2 === 0 ? 'walk-a' : 'walk-b'
      });
      this.syncCharacters();
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ playerSprite: 'idle' });
        this.syncCharacters();
        if (onComplete) onComplete();
      }
    }, 30);
  },

  onCharTap(e) {
    if (e.detail.id !== 'kiki') return;
    wx.showActionSheet({ itemList: ['挥手', '击掌', '邀请一起听歌'], success: (res) => {
      const labels = [`你向 ${this.data.peer} 挥了挥手`, `你和 ${this.data.peer} 击掌了`, '你们开始一起听歌'];
      this.flashBubble(labels[res.tapIndex]);
      RoomSync.sendAction(labels[res.tapIndex]);
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
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
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
