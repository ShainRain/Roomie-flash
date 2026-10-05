const RoomSync = require('../../utils/room-sync');
const RoomMap = require('../../utils/room-map');
const Player = require('../../utils/player');
const Layout = require('../../utils/room-layout');
const RecordsUtil = require('../../utils/records');

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

Page({
  data: {
    lightOverlay: '',
    floorTint: '',
    statusBarH: 20,
    player: { left: 40, top: 74, walking: false, direction: 'right' },
    playerSprite: 'idle',
    playerScale: 0.995,
    playerZ: 740,
    peerSprite: 'idle',
    peerDirection: 'left',
    peerScale: 0.922,
    peerZ: 640,
    syncOnline: false,
    target: null,
    peer: { left: 52, top: 64, name: 'KIKI', color: '#F5B83D' },
    actionLabel: '',
    layers: [],
    recordSlots: [],
    furnitureObjects: [],
    nearId: '',
    showHint: true,
    guitarBurst: false,
    trackTitle: '',
    platter: Layout.PLATTER,
    wallBadge: Layout.WALL_NOW_PLAYING,
    roomState: { projectorOn: false, lampOn: true, recordPlaying: false, seated: false }
  },

  moveTimer: null,
  peerTimer: null,

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarH: info.statusBarHeight || 20 });
    // 首次进入只提示一次，6 秒后淡出（P6：隐藏调试感标签）
    this.hintTimer = setTimeout(() => this.setData({ showHint: false }), 6000);
  },

  onShow() {
    this.refreshRoomConfig();
    this.applyRoomStyle();
    // 连接恢复只放在 onShow，避免 onLoad/onShow 重复 join（P4）
    if (!RoomSync.isOnline()) this.doJoin();
  },

  // DIY 状态 → 场景：家具显隐、碰撞、唱片墙槽位
  refreshRoomConfig() {
    const room = getApp().globalData.room || {};
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    RoomMap.setActiveFurniture(keys);
    const layers = Layout.FURNITURE
      .filter((f) => keys.includes(f.key))
      .map((f) => ({ key: f.key, src: f.overlay, z: f.z }));
    const prev = this.data.furnitureObjects;
    const hotspots = Layout.FIXTURE_OBJECTS
      .concat(Layout.FURNITURE.filter((f) => f.hotspot && keys.includes(f.key)).map((f) => f.hotspot))
      .map((o) => {
        const old = prev.find((p) => p.id === o.id);
        return { ...o, active: old ? old.active : false };
      });
    const selected = RecordsUtil.readSelection((k) => wx.getStorageSync(k));
    const recordSlots = Layout.RECORD_SLOTS.slice(0, selected.length)
      .map((slot, i) => ({ ...slot, key: `slot-${i}`, src: `/assets/img/rec-${selected[i]}.webp` }));
    this.setData({
      layers,
      furnitureObjects: hotspots,
      recordSlots,
      trackTitle: Player.snapshot().track.title
    });
  },

  doJoin() {
    const user = getApp().globalData.user;
    RoomSync.join({
      room: user.roomId,
      name: user.name,
      peerBase: { left: this.data.peer.left, top: this.data.peer.top },
      handlers: {
        onJoined: () => this.setData({ syncOnline: true }),
        onOffline: () => this.setData({ syncOnline: false }),
        onPeerMove: (msg) => this.animatePeer(msg),
        onPeerState: (msg) => this.applyPeerState(msg),
        onPeerAction: (msg) => this.flashAction(msg.label),
        onPeerJoin: (msg) => this.flashAction(`${msg.from} 走进了你的放映室`),
        onPeerLeave: (msg) => this.flashAction(`${msg.from} 离开了房间`)
      }
    });
  },

  // peer 位置平滑插值（不做碰撞，信任对端路径）
  animatePeer(msg) {
    const start = this.data.peer;
    const steps = 14;
    let step = 0;
    if (this.peerTimer) clearInterval(this.peerTimer);
    const direction = msg.direction || (msg.left < start.left ? 'left' : 'right');
    this.peerTimer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const done = step >= steps;
      const top = start.top + (msg.top - start.top) * ratio;
      const depth = RoomMap.depthFor(top);
      this.setData({
        peer: {
          ...this.data.peer,
          left: start.left + (msg.left - start.left) * ratio,
          top
        },
        peerDirection: direction,
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

  // 对端家具/房间状态联动（"对方开了放映机"）
  applyPeerState(msg) {
    if (msg.key) {
      this.setRoomState({ [msg.key]: msg.value });
      if (msg.key === 'lampOn') this.applyRoomStyle();
    }
    if (msg.furnitureId) this.setFurnitureState(msg.furnitureId, msg.furnitureActive !== false);
    const labels = {
      projectorOn: msg.value ? 'KIKI 打开了放映机' : 'KIKI 关闭了放映机',
      lampOn: msg.value ? 'KIKI 打开了落地灯' : 'KIKI 关掉了落地灯',
      recordPlaying: msg.value ? 'KIKI 放上了一张唱片' : 'KIKI 停下了唱片',
      seated: msg.value ? 'KIKI 坐进了沙发' : 'KIKI 站了起来'
    };
    if (msg.key && labels[msg.key]) this.flashAction(labels[msg.key]);
  },

  onFurnitureTap(e) {
    const id = e.currentTarget.dataset.id;
    const object = this.data.furnitureObjects.find((item) => item.id === id);
    if (!object) return;
    const title = this.data.trackTitle || '夜航';
    const actions = {
      'record-wall': () => {
        this.setRoomState({ recordPlaying: true });
        this.setFurnitureState(id, true);
        this.flashAction(`唱片墙：已挂 ${this.data.recordSlots.length} 张收藏 · 正在播《${title}》`);
      },
      turntable: () => {
        const playing = !this.data.roomState.recordPlaying;
        this.setRoomState({ recordPlaying: playing });
        this.setFurnitureState(id, playing);
        this.flashAction(playing ? `唱机柜：黑胶开始旋转 · 《${title}》` : '唱机已停止');
      },
      projector: () => {
        const enabled = !this.data.roomState.projectorOn;
        this.setRoomState({ projectorOn: enabled });
        this.setFurnitureState(id, enabled);
        this.flashAction(enabled ? '放映机已打开 · 房间进入观影模式' : '放映机已关闭');
      },
      sofa: () => {
        const target = RoomMap.resolveTarget(this.data.player, { left: 51.5, top: 64 });
        if (RoomMap.distance(this.data.player, target) > 10) {
          this.moveAlongPath(this.data.player, target);
          this.flashAction('走近沙发后即可坐下');
          return;
        }
        const seated = !this.data.roomState.seated;
        this.setRoomState({ seated });
        this.setFurnitureState(id, seated);
        this.setData({ playerSprite: seated ? 'sit' : 'idle' });
        this.flashAction(seated ? '你坐进了沙发 · 继续播放' : '你从沙发上站了起来');
      },
      lamp: () => {
        const enabled = !this.data.roomState.lampOn;
        this.setRoomState({ lampOn: enabled });
        this.setFurnitureState(id, enabled);
        this.applyRoomStyle();
        this.flashAction(enabled ? '落地灯已打开' : '落地灯已关闭 · 投影光更清晰');
      },
      guitar: () => {
        this.setFurnitureState(id, true);
        this.setData({ guitarBurst: true });
        if (this.guitarTimer) clearTimeout(this.guitarTimer);
        this.guitarTimer = setTimeout(() => this.setData({ guitarBurst: false }), 1600);
        this.flashAction('你拿起吉他弹了一小段即兴 Riff');
        RoomSync.sendAction('MOMO 弹了一段吉他');
      },
      'floor-records': () => {
        this.setRoomState({ recordPlaying: true });
        this.setFurnitureState(id, true);
        this.flashAction('拾起地面唱片 · 黑胶开始旋转');
      }
    };
    if (actions[id]) actions[id]();
  },

  setRoomState(next) {
    this.setData({ roomState: { ...this.data.roomState, ...next } });
    Object.keys(next).forEach((key) => RoomSync.sendState({ key, value: next[key] }));
  },

  setFurnitureState(id, active) {
    this.setData({ furnitureObjects: this.data.furnitureObjects.map((item) => item.id === id ? { ...item, active } : item) });
    RoomSync.sendState({ furnitureId: id, furnitureActive: active });
  },

  flashAction(message) {
    this.setData({ actionLabel: message });
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.actionTimer = setTimeout(() => this.setData({ actionLabel: '' }), 2600);
  },

  onRoomTap(e) {
    const { x, y } = e.detail;
    const query = wx.createSelectorQuery().in(this);
    query.select('.room-frame').boundingClientRect((rect) => {
      if (!rect) return;
      const left = ((x - rect.left) / rect.width) * 100;
      const top = ((y - rect.top) / rect.height) * 100;
      const safeTarget = RoomMap.resolveTarget(this.data.player, { left, top });
      this.moveAlongPath(this.data.player, safeTarget);
      this.setData({ target: safeTarget });
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

  // 靠近物件时才浮现名称标签（P6：默认隐藏调试感标签）
  updateNearId(pos) {
    let nearId = '';
    let best = 14;
    this.data.furnitureObjects.forEach((o) => {
      const d = RoomMap.distance(pos, { left: o.left + o.width / 2, top: o.top + o.height / 2 });
      if (d < best) { best = d; nearId = o.id; }
    });
    if (nearId !== this.data.nearId) this.setData({ nearId });
  },

  animatePlayer(left, top, onComplete) {
    if (this.moveTimer) clearInterval(this.moveTimer);
    const start = this.data.player;
    const distance = RoomMap.distance(start, { left, top });
    const steps = Math.max(8, Math.ceil(distance * 2.2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    this.setData({ player: { ...start, walking: true, direction }, playerSprite: 'walk-a' });
    this.moveTimer = setInterval(() => {
      step += 1;
      const progress = step / steps;
      const next = {
        left: start.left + (left - start.left) * progress,
        top: start.top + (top - start.top) * progress
      };
      // 步态帧交替：walk-a / walk-b
      const sprite = step % 2 === 0 ? 'walk-a' : 'walk-b';
      if (RoomMap.isBlocked(next)) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ 'player.walking': false, playerSprite: 'idle' });
        wx.showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      const depth = RoomMap.depthFor(next.top);
      this.setData({
        player: { ...next, walking: true, direction },
        playerSprite: sprite,
        playerScale: depth.scale,
        playerZ: depth.z
      });
      this.updateNearId(next);
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ 'player.walking': false, playerSprite: this.data.roomState.seated ? 'sit' : 'idle' });
        if (onComplete) onComplete();
      }
    }, 28);
  },

  onPeerTap() {
    const dx = this.data.player.left - this.data.peer.left;
    const dy = this.data.player.top - this.data.peer.top;
    if (Math.sqrt(dx * dx + dy * dy) > 22) {
      wx.showToast({ title: '走近一点再互动吧', icon: 'none' });
      const target = RoomMap.resolveTarget(this.data.player, { left: this.data.peer.left - 12, top: this.data.peer.top + 8 });
      this.moveAlongPath(this.data.player, target);
      return;
    }
    wx.showActionSheet({ itemList: ['挥手打招呼', '击掌', '一起听歌'], success: (res) => {
      const labels = ['已向 KIKI 挥手', '和 KIKI 击掌成功', '已邀请 KIKI 一起听歌'];
      this.setData({ actionLabel: labels[res.tapIndex] });
      RoomSync.sendAction(labels[res.tapIndex]);
      wx.showToast({ title: labels[res.tapIndex], icon: 'none' });
    } });
  },

  onHide() {
    RoomSync.leave();
  },

  onUnload() {
    RoomSync.leave();
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.peerTimer) clearInterval(this.peerTimer);
    if (this.actionTimer) clearTimeout(this.actionTimer);
    if (this.hintTimer) clearTimeout(this.hintTimer);
    if (this.guitarTimer) clearTimeout(this.guitarTimer);
  },

  applyRoomStyle() {
    const room = getApp().globalData.room || {};
    const k = room.lightTemp || 2700;
    const t = (k - 2700) / 3300;
    const lampFactor = this.data.roomState.lampOn ? 1 : 0.25;
    const warmA = (0.22 * (1 - t) * lampFactor).toFixed(3);
    const coolA = (0.18 * t).toFixed(3);
    const floorHex = FLOOR_COLORS[room.floor] || FLOOR_COLORS['blue-gray'];
    this.setData({
      lightOverlay: `background: linear-gradient(180deg, rgba(255,217,160,${warmA}) 0%, rgba(190,220,255,${coolA}) 100%);`,
      floorTint: `background: ${hexToRgba(floorHex, 0.45)};`
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onShare() {
    wx.showToast({ title: '明信片分享见「创建」页', icon: 'none' });
  }
});
