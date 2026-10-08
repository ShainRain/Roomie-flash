/**
 * duo — FUNCTIONAL port of miniprogram/pages/duo
 * 双人同频：两个人在同一个私人放映室里听同一首歌。
 *
 * Duo session 数据模型（无第三套状态）：
 *   { peerId, localUser, peerUser, roomState, playerState, connectionState }
 *   - peerId: 路由 ?peer=NAME（缺省 KIKI，对齐小程序 options.peer 默认值）
 *   - localUser: MOMO；peerUser: state/friends.js 查找（含 roomie_room 兼容 room + 角色 variant）
 *   - roomState: 本地房间 = state/room.js 只读（与 room 页同一份 roomie_room）；
 *     灯光/放映机开关为会话内瞬态（不写回 store，对齐小程序 setData 语义）
 *   - playerState: 全局 Player 单例（订阅/派发；对端操作为 source='remote'，不回播）
 *   - connectionState: adapters/socket.js（默认 simPeer；join 传 simPlayer getter
 *     开启对端播放活动模拟：放上唱片/换唱片，消息走 room-sync 'player' 协议形状）
 */
import './duo.css';
import RoomScene from '../components/room-scene/index.js';
import { createMiniPlayer } from '../components/player/index.js';
import { createMap } from '../shared/room-map.js';
import SceneLayout from '../shared/room-scene-layout.js';
import Player from '../state/player.js';
import RoomStore from '../state/room.js';
import RecordsUtil from '../state/records.js';
import { findFriend } from '../state/friends.js';
import RoomSync from '../adapters/socket.js';
import { getStorageSync } from '../adapters/storage.js';
import { showToast, showModal, showActionSheet } from '../adapters/platform.js';
import { back } from '../router/router.js';

// 与 room 页同一套 Master 几何与碰撞（单一数据源）；独立实例持有自己的 activeFurniture 状态
const map = createMap(SceneLayout.GEOMETRY, SceneLayout);

const LOCAL_USER = { name: 'MOMO', roomId: '0731' };
const DEFAULT_PEER = 'KIKI';

export function mount(container, ctx = {}) {
  // ---- Duo session ----
  const peerId = (ctx.query && ctx.query.peer) || DEFAULT_PEER;
  const peerUser = findFriend(peerId) || findFriend(DEFAULT_PEER);
  const session = {
    peerId: peerUser.name,
    localUser: LOCAL_USER,
    peerUser,
    roomState: { lampOn: true, projectorOn: false }, // 会话瞬态
    playerState: null, // = Player 单例快照（不复制持有）
    connectionState: 'simPeer'
  };

  const state = {
    sync: 98,
    bubbles: [],
    // 角色逻辑状态（页面持有，组件只消费渲染快照）
    player: { left: 40, top: 72, direction: 'right' },
    playerSprite: 'idle',
    peerPosition: { left: 52, top: 62 },
    peerSprite: 'idle',
    peerDirection: 'left',
    recordIds: [],
    nowPlaying: { playing: false, title: '' }
  };
  // 自动播放还原：仅当本次进入由我们"代为开播"且用户没手动碰过控制时才还原
  let autoStarted = false;
  let userTouched = false;
  const timers = { sync: null, beat: null, move: null, peer: null, bubble: null };

  // 对端角色资产：KIKI 用本人精灵；其他好友复用 momo 精灵 + 色相滤镜（同 friends vignette 语义）
  const peerChar = {
    id: peerUser.name.toLowerCase(),
    spriteBase: peerUser.variant.char,
    filter: peerUser.variant.charFilter || undefined,
    label: peerUser.name
  };

  const page = document.createElement('div');
  page.className = 'p-duo page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  // ---- 自绘顶栏 ----
  const topbar = document.createElement('div');
  topbar.className = 'topbar rise-in';
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-ic';
  backBtn.textContent = '‹';
  backBtn.addEventListener('click', () => back());
  topbar.append(backBtn, Object.assign(document.createElement('div'), { className: 'nav-ic nav-ic-ghost' }));
  scroller.appendChild(topbar);

  // ---- 刊头 + 同频状态 ----
  const titleRow = document.createElement('div');
  titleRow.className = 'duo-title-row rise-in rise-1';
  const titleLeft = document.createElement('div');
  titleLeft.className = 'duo-title-left';
  const titleCn = document.createElement('span');
  titleCn.className = 'duo-page-title';
  titleCn.textContent = '双人同频';
  const titleEn = document.createElement('span');
  titleEn.className = 'duo-page-title-en en-serif';
  titleEn.textContent = 'Duo';
  titleLeft.append(titleCn, titleEn);
  const syncPill = document.createElement('div');
  syncPill.className = 'pill pill-live pill-breathe';
  titleRow.append(titleLeft, syncPill);
  scroller.appendChild(titleRow);

  // ---- 双人房间舞台 ----
  const stageWrap = document.createElement('div');
  stageWrap.className = 'duo-stage-wrap rise-in rise-2';
  scroller.appendChild(stageWrap);

  // ---- 米白纸张共享播放卡 ----
  const playCard = document.createElement('div');
  playCard.className = 'card play-card rise-in rise-3';
  const playHead = document.createElement('div');
  playHead.className = 'play-head';
  const playInfo = document.createElement('div');
  playInfo.className = 'play-head-info';
  const duoNames = document.createElement('span');
  duoNames.className = 'duo-names';
  duoNames.textContent = `与 ${session.peerId} 一起听`;
  const duoSync = document.createElement('span');
  duoSync.className = 'duo-sync';
  playInfo.append(duoNames, duoSync);
  const wave = document.createElement('div');
  wave.className = 'sync-wave';
  wave.innerHTML = '<div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>';
  playHead.append(playInfo, wave);
  playCard.appendChild(playHead);
  const miniPlayer = createMiniPlayer(playCard, {
    subtitle: `歌单由 ${LOCAL_USER.name} 控制`,
    tapTarget: 'none',
    onControl: () => { userTouched = true; }
  });
  scroller.appendChild(playCard);

  // ---- 退出双人房 ----
  const exitBtn = document.createElement('button');
  exitBtn.className = 'btn-ghost-danger exit-btn rise-in rise-4';
  exitBtn.textContent = '退出双人房';
  exitBtn.addEventListener('click', onExit);
  scroller.appendChild(exitBtn);
  container.appendChild(page);

  function renderSyncPill() {
    syncPill.textContent = `◉ 同频中 · ${state.sync}%`;
    duoSync.textContent = `同频中 · ${state.sync}%`;
  }

  // ---- 场景 ----
  function syncCharacters() {
    scene.setProps({
      characters: [
        { id: 'momo', x: state.player.left, y: state.player.top, frame: state.playerSprite, facing: state.player.direction === 'left' ? -1 : 1, label: LOCAL_USER.name },
        { id: peerChar.id, spriteBase: peerChar.spriteBase, filter: peerChar.filter, x: state.peerPosition.left, y: state.peerPosition.top, frame: state.peerSprite, facing: state.peerDirection === 'left' ? -1 : 1, label: peerChar.label }
      ]
    });
  }

  // DIY 状态 → 场景（与房间页同一份 roomie_room / roomie_records，只读）
  function refreshScene() {
    const room = RoomStore.getRoom();
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    map.setActiveFurniture(keys);
    state.recordIds = RecordsUtil.readSelection(getStorageSync);
    const snap = Player.snapshot();
    state.nowPlaying = { playing: snap.playing, title: snap.track.title };
    scene.setProps({
      furniture: keys.slice(),
      records: state.recordIds.slice(),
      floor: room.floor || 'blue-gray',
      lightTemp: room.lightTemp || 2700,
      lightBright: typeof room.lightBright === 'number' ? room.lightBright : 100,
      lampOn: session.roomState.lampOn,
      projectorOn: session.roomState.projectorOn,
      nowPlaying: state.nowPlaying
    });
  }

  function flashBubble(text) {
    state.bubbles = [{ id: 'interaction', x: 50, y: 88, text, kind: 'info' }];
    scene.setProps({ bubbles: state.bubbles });
    if (timers.bubble) clearTimeout(timers.bubble);
    timers.bubble = setTimeout(() => {
      state.bubbles = [];
      scene.setProps({ bubbles: [] });
    }, 2600);
  }

  const scene = new RoomScene(stageWrap, {
    mode: 'duo',
    characters: [],
    bubbles: [],
    nowPlaying: state.nowPlaying,
    onStageTap: onSceneTap,
    onFurnitureTap,
    onCharTap
  });
  refreshScene();
  syncCharacters();
  renderSyncPill();

  // ---- 播放器同步（订阅全局单例；对端 remote 应用不回播）----
  let lastBroadcast = null;
  function onPlayerSnap(snap, source) {
    state.nowPlaying = { playing: snap.playing, title: snap.track.title };
    scene.setProps({ nowPlaying: state.nowPlaying });
    if (source === 'remote') return;
    const jumped = lastBroadcast ? Math.abs(snap.position - lastBroadcast.position) > 3 : false;
    if (!lastBroadcast || snap.index !== lastBroadcast.index || snap.playing !== lastBroadcast.playing || jumped) {
      RoomSync.sendPlayer({ index: snap.index, position: snap.position, playing: snap.playing });
    }
    lastBroadcast = { index: snap.index, playing: snap.playing, position: snap.position };
  }
  const unsubPlayer = Player.subscribe(onPlayerSnap);

  // 代为开播：进房时若暂停则自动播放（退出时视用户操作还原）
  if (!Player.snapshot().playing) {
    Player.play();
    autoStarted = true;
  }

  // ---- 同步会话（默认 simPeer；simPlayer 开启对端播放活动模拟）----
  RoomSync.join({
    room: LOCAL_USER.roomId,
    name: LOCAL_USER.name,
    peerBase: { ...state.peerPosition },
    simPlayer: () => Player.snapshot(),
    handlers: {
      onPeerMove: (msg) => animatePeer(msg),
      onPeerPlayer: (msg) => {
        // 缓存补发（from: '__cache'）可能是陈旧进度，只采纳曲目与播放态
        if (msg && msg.from === '__cache') Player.applyRemote({ index: msg.index, playing: msg.playing });
        else Player.applyRemote(msg);
      },
      onPeerAction: (msg) => flashBubble(msg.label),
      onPeerJoin: (msg) => flashBubble(`${msg.from || session.peerId} 进入了房间`),
      onPeerLeave: (msg) => flashBubble(`${msg.from || session.peerId} 离开了`)
    }
  });

  // 同频 %（演示值，对齐小程序 5s 抖动语义）
  timers.sync = setInterval(() => {
    state.sync = 95 + Math.floor(Math.random() * 5);
    renderSyncPill();
  }, 5000);
  // 播放进度心跳：每 5s 向房间广播一次（在线时），对端按 2.5s 容差校正
  timers.beat = setInterval(() => {
    const snap = Player.snapshot();
    if (snap.playing && RoomSync.isOnline()) {
      RoomSync.sendPlayer({ index: snap.index, position: snap.position, playing: snap.playing });
      lastBroadcast = { index: snap.index, playing: snap.playing, position: snap.position };
    }
  }, 5000);

  // peer 位置平滑插值（信任对端路径，不做碰撞）
  function animatePeer(msg) {
    const start = state.peerPosition;
    const steps = 14;
    let step = 0;
    if (timers.peer) clearInterval(timers.peer);
    const direction = msg.direction || (msg.left < start.left ? 'left' : 'right');
    timers.peer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const done = step >= steps;
      state.peerPosition = {
        left: start.left + (msg.left - start.left) * ratio,
        top: start.top + (msg.top - start.top) * ratio
      };
      state.peerDirection = direction;
      state.peerSprite = done ? 'idle' : (step % 2 === 0 ? 'walk-a' : 'walk-b');
      syncCharacters();
      if (done) {
        clearInterval(timers.peer);
        timers.peer = null;
      }
    }, 40);
  }

  function onSceneTap({ left, top }) {
    if (typeof left !== 'number') return;
    const next = map.resolveTarget(state.player, { left, top });
    moveAlongPath(state.player, next);
    const dx = next.left - state.peerPosition.left;
    const dy = next.top - state.peerPosition.top;
    if (Math.sqrt(dx * dx + dy * dy) < 18) flashBubble(`靠近了 ${session.peerId}，点击对方互动`);
  }

  // 双人房家具热点：灯光/放映机即时生效，其余给轻量反馈（不写房间状态机）
  function onFurnitureTap({ id }) {
    const flavor = {
      'record-wall': `唱片墙：已挂 ${state.recordIds.length} 张收藏 · 正在播《${state.nowPlaying.title}》`,
      turntable: '黑胶在转，别停',
      sofa: '沙发留给你们俩',
      guitar: `${session.peerId} 最喜欢这一段 Riff`,
      'floor-records': '地面的唱片是昨晚没放完的'
    };
    if (id === 'lamp') {
      session.roomState.lampOn = !session.roomState.lampOn;
      scene.setProps({ lampOn: session.roomState.lampOn });
      flashBubble(session.roomState.lampOn ? '落地灯已打开' : '落地灯已关闭 · 投影光更清晰');
      return;
    }
    if (id === 'projector') {
      session.roomState.projectorOn = !session.roomState.projectorOn;
      scene.setProps({ projectorOn: session.roomState.projectorOn });
      flashBubble(session.roomState.projectorOn ? '放映机已打开 · 房间进入观影模式' : '放映机已关闭');
      return;
    }
    if (flavor[id]) flashBubble(flavor[id]);
  }

  function moveAlongPath(start, target) {
    const path = map.findPath(start, target);
    const walkNext = (index) => {
      if (index >= path.length) return;
      const point = path[index];
      animatePlayer(point.left, point.top, () => walkNext(index + 1));
    };
    walkNext(0);
  }

  function animatePlayer(left, top, onComplete) {
    if (timers.move) clearInterval(timers.move);
    const start = state.player;
    const distance = map.distance(start, { left, top });
    const steps = Math.max(8, Math.ceil(distance * 2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    state.playerSprite = 'walk-a';
    syncCharacters();
    timers.move = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const next = {
        left: start.left + (left - start.left) * ratio,
        top: start.top + (top - start.top) * ratio
      };
      if (map.isBlocked(next)) {
        clearInterval(timers.move);
        timers.move = null;
        state.playerSprite = 'idle';
        syncCharacters();
        showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      state.player = { left: next.left, top: next.top, direction };
      state.playerSprite = step % 2 === 0 ? 'walk-a' : 'walk-b';
      syncCharacters();
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(timers.move);
        timers.move = null;
        state.playerSprite = 'idle';
        syncCharacters();
        if (onComplete) onComplete();
      }
    }, 30);
  }

  function onCharTap({ id }) {
    if (id !== peerChar.id) return;
    showActionSheet({ itemList: ['挥手', '击掌', '邀请一起听歌'] }).then((res) => {
      if (res.cancelled || res.tapIndex < 0) return;
      const labels = [`你向 ${session.peerId} 挥了挥手`, `你和 ${session.peerId} 击掌了`, '你们开始一起听歌'];
      flashBubble(labels[res.tapIndex]);
      RoomSync.sendAction(labels[res.tapIndex]);
    });
  }

  function onExit() {
    showModal({
      title: '退出双人放映？',
      content: `${session.peerId} 会继续留在房间里听歌`,
      confirmText: '退出'
    }).then((res) => {
      if (res.confirm) back();
    });
  }

  return {
    unmount() {
      RoomSync.leave();
      unsubPlayer();
      Object.keys(timers).forEach((k) => {
        if (timers[k]) {
          clearInterval(timers[k]);
          clearTimeout(timers[k]);
          timers[k] = null;
        }
      });
      // 还原：进入前是暂停、且用户没主动操作过播放器 → 退出时恢复暂停
      if (autoStarted && !userTouched && Player.snapshot().playing) {
        Player.toggle();
      }
      scene.destroy();
      miniPlayer.destroy();
      page.remove();
    }
  };
}

let ctxRef = null;

export default {
  mount(containerEl, ctx) {
    ctxRef = mount(containerEl, ctx);
  },
  unmount() {
    if (ctxRef) {
      ctxRef.unmount();
      ctxRef = null;
    }
  }
};
