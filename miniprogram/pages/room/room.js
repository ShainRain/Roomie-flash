const RoomSync = require('../../utils/room-sync');
const RoomMap = require('../../utils/room-map');
const Player = require('../../utils/player');
const SceneLayout = require('../../utils/room-scene-layout');
const RecordsUtil = require('../../utils/records');

// Room Master Scene 地图实例：新几何 + 碰撞/障碍由 room-scene-layout 单一数据源驱动
const map = RoomMap.createMap(SceneLayout.GEOMETRY, SceneLayout);

// 各交互对象的提示锚点（stage %）：吉他音符飘点取吉他锚点
const GUITAR_BUBBLE_AT = { x: 56.6, y: 64 };

Page({
  data: {
    statusBarH: 20,
    // 场景输入（room-scene 组件属性）
    floor: 'blue-gray',
    lightTemp: 2700,
    furnitureKeys: [],
    recordIds: [],
    characters: [],
    nowPlaying: { playing: false, title: '' },
    bubbles: [],
    nearId: '',
    activeIds: [],
    showHint: true,
    // 角色逻辑状态（页面持有，组件只消费渲染快照）
    player: { left: 40, top: 74, direction: 'right' },
    playerSprite: 'idle',
    peer: { left: 52, top: 64, name: 'KIKI' },
    peerSprite: 'idle',
    peerDirection: 'left',
    syncOnline: false,
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
    // onShow 首帧前的 setData 可能丢失组件 properties 同步(实测 furniture 为空),
    // 推迟到下一拍,等组件绑定建立后再写入场景配置。
    const apply = () => {
      this.refreshRoomConfig();
      this.syncCharacters();
    };
    if (wx.nextTick) wx.nextTick(apply); else setTimeout(apply, 0);
    // 连接恢复只放在 onShow，避免 onLoad/onShow 重复 join（P4）
    if (!RoomSync.isOnline()) this.doJoin();
  },

  // DIY 状态 → 场景：家具显隐、碰撞、唱片墙槽位、地板与灯光
  refreshRoomConfig() {
    const room = getApp().globalData.room || {};
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    map.setActiveFurniture(keys);
    this.hotspotSpots = SceneLayout.FIXTURE_OBJECTS
      .concat(SceneLayout.FURNITURE
        .filter((f) => f.hotspot && (f.fixed || keys.includes(f.id)))
        .map((f) => f.hotspot));
    const selected = RecordsUtil.readSelection((k) => wx.getStorageSync(k));
    const trackTitle = Player.snapshot().track.title;
    this.setData({
      // 注意:必须传新数组引用。globalData/storage 的同一数组引用反复 setData 时,
      // 组件 properties 可能收不到同步(实测 binding 丢失),切片拷贝可稳定触发。
      furnitureKeys: keys.slice(),
      recordIds: selected.slice(),
      floor: room.floor || 'blue-gray',
      lightTemp: room.lightTemp || 2700,
      nowPlaying: { playing: this.data.roomState.recordPlaying, title: trackTitle }
    });
  },

  // 页面逻辑状态 → 组件渲染快照
  syncCharacters() {
    const { player, playerSprite, peer, peerSprite, peerDirection } = this.data;
    this.setData({
      characters: [
        { id: 'momo', x: player.left, y: player.top, frame: playerSprite, facing: player.direction === 'left' ? -1 : 1, label: '我' },
        { id: 'kiki', x: peer.left, y: peer.top, frame: peerSprite, facing: peerDirection === 'left' ? -1 : 1, label: peer.name }
      ]
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
      this.setData({
        peer: {
          ...this.data.peer,
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

  // 对端家具/房间状态联动（"对方开了放映机"）
  applyPeerState(msg) {
    if (msg.key) this.setRoomState({ [msg.key]: msg.value });
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
    const id = e.detail.id;
    const known = (this.hotspotSpots || []).find((item) => item.id === id);
    if (!known) return;
    const title = this.data.nowPlaying.title || '夜航';
    const actions = {
      'record-wall': () => {
        this.setRoomState({ recordPlaying: true });
        this.setFurnitureState(id, true);
        this.flashAction(`唱片墙：已挂 ${this.data.recordIds.length} 张收藏 · 正在播《${title}》`);
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
        const target = map.resolveTarget(this.data.player, map.fromUV(0.24, 0.47));
        if (map.distance(this.data.player, target) > 10) {
          this.moveAlongPath(this.data.player, target);
          this.flashAction('走近沙发后即可坐下');
          return;
        }
        const seated = !this.data.roomState.seated;
        this.setRoomState({ seated });
        this.setFurnitureState(id, seated);
        this.setData({ playerSprite: seated ? 'sit' : 'idle' });
        this.syncCharacters();
        this.flashAction(seated ? '你坐进了沙发 · 继续播放' : '你从沙发上站了起来');
      },
      lamp: () => {
        const enabled = !this.data.roomState.lampOn;
        this.setRoomState({ lampOn: enabled });
        this.setFurnitureState(id, enabled);
        this.flashAction(enabled ? '落地灯已打开' : '落地灯已关闭 · 投影光更清晰');
      },
      guitar: () => {
        this.setFurnitureState(id, true);
        this.setData({
          bubbles: this.data.bubbles.concat([{ id: 'guitar', x: GUITAR_BUBBLE_AT.x, y: GUITAR_BUBBLE_AT.y, text: '♪ ♫ ♪', kind: 'notes' }])
        });
        if (this.guitarTimer) clearTimeout(this.guitarTimer);
        this.guitarTimer = setTimeout(() => {
          this.setData({ bubbles: this.data.bubbles.filter((b) => b.id !== 'guitar') });
        }, 1600);
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
    const roomState = { ...this.data.roomState, ...next };
    this.setData({
      roomState,
      nowPlaying: { playing: roomState.recordPlaying, title: this.data.nowPlaying.title }
    });
    Object.keys(next).forEach((key) => RoomSync.sendState({ key, value: next[key] }));
  },

  setFurnitureState(id, active) {
    const set = new Set(this.data.activeIds);
    if (active) set.add(id); else set.delete(id);
    this.setData({ activeIds: Array.from(set) });
    RoomSync.sendState({ furnitureId: id, furnitureActive: active });
  },

  flashAction(message) {
    const bubbles = this.data.bubbles.filter((b) => b.id !== 'action')
      .concat([{ id: 'action', x: 50, y: 42, text: message, kind: 'info' }]);
    this.setData({ bubbles });
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.actionTimer = setTimeout(() => {
      this.setData({ bubbles: this.data.bubbles.filter((b) => b.id !== 'action') });
    }, 2600);
  },

  onSceneTap(e) {
    if (!e.detail || typeof e.detail.left !== 'number') return;
    const safeTarget = map.resolveTarget(this.data.player, e.detail);
    this.moveAlongPath(this.data.player, safeTarget);
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

  // 靠近物件时才浮现名称标签（P6：默认隐藏调试感标签）
  updateNearId(pos) {
    let nearId = '';
    let best = 14;
    (this.hotspotSpots || []).forEach((o) => {
      const d = map.distance(pos, { left: o.left + o.width / 2, top: o.top + o.height / 2 });
      if (d < best) { best = d; nearId = o.id; }
    });
    if (nearId !== this.data.nearId) this.setData({ nearId });
  },

  animatePlayer(left, top, onComplete) {
    if (this.moveTimer) clearInterval(this.moveTimer);
    const start = this.data.player;
    const distance = map.distance(start, { left, top });
    const steps = Math.max(8, Math.ceil(distance * 2.2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    this.setData({ player: { ...start, direction }, playerSprite: 'walk-a' });
    this.syncCharacters();
    this.moveTimer = setInterval(() => {
      step += 1;
      const progress = step / steps;
      const next = {
        left: start.left + (left - start.left) * progress,
        top: start.top + (top - start.top) * progress
      };
      // 步态帧交替：walk-a / walk-b
      const sprite = step % 2 === 0 ? 'walk-a' : 'walk-b';
      if (map.isBlocked(next)) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ playerSprite: 'idle' });
        this.syncCharacters();
        wx.showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      this.setData({ player: { ...next, direction }, playerSprite: sprite });
      this.syncCharacters();
      this.updateNearId(next);
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(this.moveTimer);
        this.moveTimer = null;
        this.setData({ playerSprite: this.data.roomState.seated ? 'sit' : 'idle' });
        this.syncCharacters();
        if (onComplete) onComplete();
      }
    }, 28);
  },

  onCharTap(e) {
    if (e.detail.id !== 'kiki') return;
    const dx = this.data.player.left - this.data.peer.left;
    const dy = this.data.player.top - this.data.peer.top;
    if (Math.sqrt(dx * dx + dy * dy) > 22) {
      wx.showToast({ title: '走近一点再互动吧', icon: 'none' });
      const target = map.resolveTarget(this.data.player, { left: this.data.peer.left - 12, top: this.data.peer.top + 8 });
      this.moveAlongPath(this.data.player, target);
      return;
    }
    wx.showActionSheet({ itemList: ['挥手打招呼', '击掌', '一起听歌'], success: (res) => {
      const labels = ['已向 KIKI 挥手', '和 KIKI 击掌成功', '已邀请 KIKI 一起听歌'];
      this.flashAction(labels[res.tapIndex]);
      RoomSync.sendAction(labels[res.tapIndex]);
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

  onBack() {
    wx.navigateBack();
  },

  // 从存储重载房间配置(与 app.onLaunch 同路径,保证 same-realm 数据;自动化验收用)
  reloadRoomFromStorage() {
    getApp().globalData.room = getApp().normalizeRoom(wx.getStorageSync('roomie_room'));
    this.refreshRoomConfig();
    this.syncCharacters();
  },

  onShare() {
    wx.showToast({ title: '明信片分享见「创建」页', icon: 'none' });
  }
});
