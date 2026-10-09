/**
 * room — FUNCTIONAL port of miniprogram/pages/room
 * Full-stage interactive RoomScene: tap-to-walk (A* via shared/room-map.js),
 * 7 furniture hotspot action chains, bubbles, simPeer KIKI via adapters/socket.js,
 * docked mini-player. Room state read from state/room.js (persisted DIY config).
 */
import RoomScene from '../components/room-scene/index.js';
import { createMiniPlayer } from '../components/player/index.js';
import { createMap } from '../shared/room-map.js';
import SceneLayout from '../shared/room-scene-layout.js';
import Player from '../state/player.js';
import RoomStore from '../state/room.js';
import RecordsUtil from '../state/records.js';
import RoomSync from '../adapters/socket.js';
import Avatar from '../adapters/avatar.js';
import { getStorageSync } from '../adapters/storage.js';
import { showToast, showActionSheet } from '../adapters/platform.js';
import { back, navigate } from '../router/router.js';

// Room Master Scene 地图实例：新几何 + 碰撞/障碍由 room-scene-layout 单一数据源驱动
const map = createMap(SceneLayout.GEOMETRY, SceneLayout);

// 各交互对象的提示锚点（stage %）：吉他音符飘点取吉他锚点
const GUITAR_BUBBLE_AT = { x: 56.6, y: 64 };

// 沙发坐垫落座点 = collision uv 中心（与小程序 SOFA_SEAT_UV 同源，不写死坐标）
const SOFA_FURN = SceneLayout.FURNITURE.find((f) => f.id === 'sofa');
const SOFA_SEAT_UV = SOFA_FURN && SOFA_FURN.collision
  ? { u: (SOFA_FURN.collision.u0 + SOFA_FURN.collision.u1) / 2, v: (SOFA_FURN.collision.v0 + SOFA_FURN.collision.v1) / 2 }
  : { u: 0.1, v: 0.45 };

export function mount(container) {
  const state = {
    // 场景输入（room-scene 组件属性）
    bubbles: [],
    nearId: '',
    activeIds: [],
    showHint: true,
    // 角色逻辑状态（页面持有，组件只消费渲染快照）
    player: { left: 40, top: 74, direction: 'right' },
    playerSprite: 'idle',
    preSeatPos: null, // 入座前位置（起身恢复用；绝不回出生点）
    peer: { left: 52, top: 64, name: 'KIKI' },
    peerSprite: 'idle',
    peerDirection: 'left',
    syncOnline: false,
    roomState: { projectorOn: false, lampOn: true, seated: false },
    nowPlaying: { playing: Player.snapshot().playing, title: Player.snapshot().track.title },
    recordIds: [],
    recordWallCursor: -1 // 唱片选择可能变化，进入房间后从第一张重新轮流（对齐小程序 room.js）
  };

  const timers = { move: null, peer: null, action: null, hint: null, guitar: null, recordWall: null };

  const page = document.createElement('div');
  page.className = 'p-room page';

  // 顶部栏
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-ic';
  backBtn.textContent = '‹';
  backBtn.addEventListener('click', () => back());
  const livePill = document.createElement('div');
  livePill.className = 'pill pill-live';
  livePill.textContent = '● 正在播放 · LIVE';
  const shareBtn = document.createElement('button');
  shareBtn.className = 'nav-ic';
  shareBtn.textContent = '↗';
  shareBtn.addEventListener('click', () => navigate('/postcard')); // web 分享入口 = 明信片
  topbar.append(backBtn, livePill, shareBtn);
  page.appendChild(topbar);

  // 全舞台
  const stageWrap = document.createElement('div');
  stageWrap.className = 'stage-wrap';
  page.appendChild(stageWrap);

  const hintEl = document.createElement('div');
  hintEl.className = 'room-hint';
  hintEl.textContent = '点击房间任意位置移动 · 点击物件进行互动';
  page.appendChild(hintEl);

  const dock = document.createElement('div');
  dock.className = 'dock';
  const miniPlayer = createMiniPlayer(dock);
  page.appendChild(dock);
  container.appendChild(page);

  let scene = null;
  let hotspotSpots = [];

  // 页面逻辑状态 → 组件渲染快照
  function syncCharacters() {
    if (!scene) return;
    const outfit = Avatar.path('outfit'); // 自定义服装替换默认 MOMO 精灵（对齐小程序 room.js）
    // 坐下时 zBoost +80：角色在沙发坐垫层之上（落座点角色 z=450 < 沙发 z=519，不抬层会被整只遮挡）；
    // pointerNone：落座中点击穿透，保证压住沙发热点的角色不会吞掉"点沙发站起"的点击
    const zBoost = state.roomState.seated ? 80 : 0;
    scene.setProps({
      characters: [
        { id: 'momo', x: state.player.left, y: state.player.top, frame: state.playerSprite, facing: state.player.direction === 'left' ? -1 : 1, label: '我', spriteSrc: outfit || undefined, zBoost, pointerNone: state.roomState.seated },
        { id: 'kiki', x: state.peer.left, y: state.peer.top, frame: state.peerSprite, facing: state.peerDirection === 'left' ? -1 : 1, label: state.peer.name }
      ]
    });
  }

  // DIY 状态 → 场景：家具显隐、碰撞、唱片墙槽位、地板与灯光
  function refreshRoomConfig() {
    const room = RoomStore.getRoom();
    const keys = Array.isArray(room.furniture) ? room.furniture : [];
    map.setActiveFurniture(keys);
    hotspotSpots = SceneLayout.FIXTURE_OBJECTS
      .concat(SceneLayout.FURNITURE
        .filter((f) => f.hotspot && (f.fixed || keys.includes(f.id)))
        .map((f) => f.hotspot));
    state.recordIds = RecordsUtil.readSelection(getStorageSync);
    state.recordWallCursor = -1; // 进入房间从第一张重新轮流（对齐小程序 refreshRoomConfig）
    if (!scene) return;
    scene.setProps({
      furniture: keys.slice(),
      records: state.recordIds.slice(),
      floor: room.floor || 'blue-gray',
      lightTemp: room.lightTemp || 2700,
      lightBright: typeof room.lightBright === 'number' ? room.lightBright : 100,
      lampOn: state.roomState.lampOn,
      projectorOn: state.roomState.projectorOn,
      // 唱盘/墙上徽标以全局 Player 快照为准（唱机真实播放 = Player.playing）
      nowPlaying: { playing: Player.snapshot().playing, title: Player.snapshot().track.title }
    });
  }

  function setSceneProps(partial) {
    if (scene) scene.setProps(partial);
  }

  // ---- 播放器同步（全局 Player 快照为唯一事实：播放态 + 曲名；走秒 tick 不重绘场景）----
  function onPlayerSnap(snap, source) {
    const np = { playing: snap.playing, title: snap.track.title };
    if (np.playing !== state.nowPlaying.playing || np.title !== state.nowPlaying.title) {
      state.nowPlaying = np;
      setSceneProps({ nowPlaying: np });
    }
    // 对端应用过的状态不再回播（防止两地互相回声）
    if (source === 'remote') return;
    broadcastPlayer(snap);
  }

  let lastBroadcast = null;
  // 切歌/播放暂停/seek 跳变即时报给房间里的人；正常走秒（1s 一次）不报
  function broadcastPlayer(snap) {
    if (!RoomSync.isOnline()) return;
    const last = lastBroadcast;
    const jumped = last ? Math.abs(snap.position - last.position) > 3 : false;
    if (!last || snap.index !== last.index || snap.playing !== last.playing || jumped) {
      RoomSync.sendPlayer({ index: snap.index, position: snap.position, playing: snap.playing });
    }
    lastBroadcast = { index: snap.index, playing: snap.playing, position: snap.position };
  }

  // 中继补发的缓存状态（from: '__cache'）只采纳曲目与播放态
  function applyPeerPlayer(msg) {
    if (!msg) return;
    if (msg.from === '__cache') {
      Player.applyRemote({ index: msg.index, playing: msg.playing });
      return;
    }
    Player.applyRemote(msg);
  }

  // peer 位置平滑插值（不做碰撞，信任对端路径）
  function animatePeer(msg) {
    const start = state.peer;
    const steps = 14;
    let step = 0;
    if (timers.peer) clearInterval(timers.peer);
    const direction = msg.direction || (msg.left < start.left ? 'left' : 'right');
    timers.peer = setInterval(() => {
      step += 1;
      const ratio = step / steps;
      const done = step >= steps;
      state.peer = {
        ...state.peer,
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

  // 对端家具/房间状态联动
  function applyPeerState(msg) {
    // 对端 seated 是 PEER 的状态：只驱动对端角色精灵，绝不触碰本地 roomState/位置/preSeatPos
    if (msg.key === 'seated') {
      state.peerSprite = msg.value ? 'sit' : 'idle';
      syncCharacters();
    } else if (msg.key) {
      setRoomState({ [msg.key]: msg.value }, false);
    }
    if (msg.furnitureId) setFurnitureState(msg.furnitureId, msg.furnitureActive !== false, false);
    const labels = {
      projectorOn: msg.value ? 'KIKI 打开了放映机' : 'KIKI 关闭了放映机',
      lampOn: msg.value ? 'KIKI 打开了落地灯' : 'KIKI 关掉了落地灯',
      recordPlaying: msg.value ? 'KIKI 放上了一张唱片' : 'KIKI 停下了唱片',
      seated: msg.value ? 'KIKI 坐进了沙发' : 'KIKI 站了起来'
    };
    if (msg.key && labels[msg.key]) flashAction(labels[msg.key]);
  }

  function setRoomState(next, broadcast = true) {
    state.roomState = { ...state.roomState, ...next };
    setSceneProps({
      lampOn: state.roomState.lampOn,
      projectorOn: state.roomState.projectorOn
    });
    if (state.roomState.seated === false && state.playerSprite === 'sit') {
      state.playerSprite = 'idle';
      syncCharacters();
    }
    if (broadcast) Object.keys(next).forEach((key) => RoomSync.sendState({ key, value: next[key] }));
  }

  function setFurnitureState(id, active, broadcast = true) {
    const set = new Set(state.activeIds);
    if (active) set.add(id); else set.delete(id);
    state.activeIds = Array.from(set);
    setSceneProps({ activeIds: state.activeIds });
    if (broadcast) RoomSync.sendState({ furnitureId: id, furnitureActive: active });
  }

  function flashAction(message) {
    state.bubbles = state.bubbles.filter((b) => b.id !== 'action')
      .concat([{ id: 'action', x: 50, y: 42, text: message, kind: 'info' }]);
    setSceneProps({ bubbles: state.bubbles });
    if (timers.action) clearTimeout(timers.action);
    timers.action = setTimeout(() => {
      state.bubbles = state.bubbles.filter((b) => b.id !== 'action');
      setSceneProps({ bubbles: state.bubbles });
    }, 2600);
  }

  function onFurnitureTap({ id }) {
    const known = hotspotSpots.find((item) => item.id === id);
    if (!known) return;
    // 落座锁：坐在沙发上只响应"再点沙发站起"，其余家具交互一律拒绝（对齐小程序）
    if (state.roomState.seated && id !== 'sofa') {
      flashAction('你正坐在沙发上 · 点击沙发站起后才能互动');
      return;
    }
    const actions = {
      'record-wall': () => {
        // 唱片墙 = 收藏轮播展示，不触发真实播放（播放走 turntable/floor-records）
        const ids = state.recordIds;
        if (!ids.length) {
          flashAction('唱片墙还是空的 · 去「我的」选几张唱片挂上吧');
          return;
        }
        // 轮流展示「我的」唱片墙中已选中的唱片名称：每次点击切换到下一张，循环往复（对齐小程序 room.js）
        state.recordWallCursor = ((state.recordWallCursor == null ? -1 : state.recordWallCursor) + 1) % ids.length;
        const rec = RecordsUtil.byId(ids[state.recordWallCursor]);
        const name = rec ? rec.title : '未知唱片';
        setFurnitureState(id, true);
        // 气泡锚在唱片墙上方（stage %），与墙面槽位同位浮现（对齐小程序 x:24 y:10）
        state.bubbles = state.bubbles.filter((b) => b.id !== 'record-wall')
          .concat([{ id: 'record-wall', x: 24, y: 10, text: `♪ ${state.recordWallCursor + 1}/${ids.length} · 《${name}》`, kind: 'info' }]);
        setSceneProps({ bubbles: state.bubbles });
        if (timers.recordWall) clearTimeout(timers.recordWall);
        timers.recordWall = setTimeout(() => {
          state.bubbles = state.bubbles.filter((b) => b.id !== 'record-wall');
          setSceneProps({ bubbles: state.bubbles });
        }, 2600);
      },
      turntable: () => {
        Player.toggle(); // 全局 Player 真实播放/暂停
        const playing = Player.snapshot().playing;
        setFurnitureState(id, playing);
        flashAction(playing ? `唱机柜：黑胶开始旋转 · 《${Player.snapshot().track.title}》` : '唱机已停止');
      },
      projector: () => {
        const enabled = !state.roomState.projectorOn;
        setRoomState({ projectorOn: enabled });
        setFurnitureState(id, enabled);
        flashAction(enabled ? '放映机已打开 · 房间进入观影模式' : '放映机已关闭');
      },
      sofa: () => {
        // —— 站起：传送回点击坐下前保存的坐标，恢复站立（绝不回出生点） ——
        if (state.roomState.seated) {
          const back = state.preSeatPos || map.resolveTarget(state.player, map.fromUV(0.24, 0.47));
          state.preSeatPos = null;
          setRoomState({ seated: false });
          setFurnitureState(id, false);
          state.player.left = back.left;
          state.player.top = back.top;
          state.playerSprite = 'idle';
          syncCharacters();
          updateNearId(back);
          RoomSync.sendMove({ left: back.left, top: back.top, direction: state.player.direction, walking: false });
          flashAction('你从沙发上站了起来');
          return;
        }
        // —— 坐下：保存当前坐标、取消进行中的寻路，直接传送落座到沙发坐垫 ——
        // 不经 resolveTarget 钳制：坐垫在可行走菱形之外，钳制会把落座点吸到
        // 沙发前方的地上（即"随地大小坐" bug）。与小程序 room.js sofa 分支同逻辑。
        state.preSeatPos = { left: state.player.left, top: state.player.top };
        if (timers.move) { clearInterval(timers.move); timers.move = null; }
        const seat = map.fromUV(SOFA_SEAT_UV.u, SOFA_SEAT_UV.v);
        setRoomState({ seated: true });
        setFurnitureState(id, true);
        state.player.left = seat.left;
        state.player.top = seat.top;
        state.playerSprite = 'sit';
        syncCharacters();
        updateNearId(seat);
        // 层级：落座点角色 z=450 < 沙发 z=519，syncCharacters 的 seated zBoost=+80
        // 抬到 530（仍低于前景小物/桌面，空间秩序与小程序一致），保证不被沙发遮挡
        RoomSync.sendMove({ left: seat.left, top: seat.top, direction: state.player.direction, walking: false });
        flashAction('你坐进了沙发 · 点击沙发可站起');
      },
      lamp: () => {
        const enabled = !state.roomState.lampOn;
        setRoomState({ lampOn: enabled });
        setFurnitureState(id, enabled);
        flashAction(enabled ? '落地灯已打开' : '落地灯已关闭 · 投影光更清晰');
      },
      guitar: () => {
        setFurnitureState(id, true);
        state.bubbles = state.bubbles.concat([{ id: 'guitar', x: GUITAR_BUBBLE_AT.x, y: GUITAR_BUBBLE_AT.y, text: '♪ ♫ ♪', kind: 'notes' }]);
        setSceneProps({ bubbles: state.bubbles });
        if (timers.guitar) clearTimeout(timers.guitar);
        timers.guitar = setTimeout(() => {
          state.bubbles = state.bubbles.filter((b) => b.id !== 'guitar');
          setSceneProps({ bubbles: state.bubbles });
        }, 1600);
        flashAction('你拿起吉他弹了一小段即兴 Riff');
        RoomSync.sendAction('MOMO 弹了一段吉他');
      },
      'floor-records': () => {
        Player.play(); // 「黑胶开始旋转」= 真实播放
        setFurnitureState(id, true);
        flashAction('拾起地面唱片 · 黑胶开始旋转');
      }
    };
    if (actions[id]) actions[id]();
  }

  // 坐下：阻断行走覆写坐姿；preSeatPos 只记录一次（走近就坐的情形已在点按时记录）
  function onSceneTap({ left, top }) {
    if (typeof left !== 'number') return;
    // 落座锁：坐着时地面点击不寻路（只能点沙发站起），对齐小程序
    if (state.roomState.seated) {
      flashAction('你正坐在沙发上 · 点击沙发站起后才能走动');
      return;
    }
    const safeTarget = map.resolveTarget(state.player, { left, top });
    moveAlongPath(state.player, safeTarget);
  }

  function moveAlongPath(start, target, onComplete) {
    const path = map.findPath(start, target);
    const walkNext = (index) => {
      if (index >= path.length) {
        if (onComplete) onComplete();
        return;
      }
      const point = path[index];
      animatePlayer(point.left, point.top, () => walkNext(index + 1));
    };
    walkNext(0);
  }

  // 靠近物件时才浮现名称标签
  function updateNearId(pos) {
    let nearId = '';
    let best = 14;
    hotspotSpots.forEach((o) => {
      const d = map.distance(pos, { left: o.left + o.width / 2, top: o.top + o.height / 2 });
      if (d < best) { best = d; nearId = o.id; }
    });
    if (nearId !== state.nearId) {
      state.nearId = nearId;
      setSceneProps({ nearId });
    }
  }

  function animatePlayer(left, top, onComplete) {
    if (timers.move) clearInterval(timers.move);
    const start = state.player;
    const distance = map.distance(start, { left, top });
    const steps = Math.max(8, Math.ceil(distance * 2.2));
    const direction = left < start.left ? 'left' : 'right';
    let step = 0;
    state.player = { ...start, direction };
    state.playerSprite = 'walk-a';
    syncCharacters();
    timers.move = setInterval(() => {
      step += 1;
      const progress = step / steps;
      const next = {
        left: start.left + (left - start.left) * progress,
        top: start.top + (top - start.top) * progress
      };
      const sprite = step % 2 === 0 ? 'walk-a' : 'walk-b';
      if (map.isBlocked(next)) {
        clearInterval(timers.move);
        timers.move = null;
        state.playerSprite = 'idle';
        syncCharacters();
        showToast({ title: '前方有家具，已停在安全位置', icon: 'none', duration: 1200 });
        return;
      }
      state.player = { ...next, direction };
      state.playerSprite = sprite;
      syncCharacters();
      updateNearId(next);
      RoomSync.sendMove({ left: next.left, top: next.top, direction, walking: true });
      if (step >= steps) {
        clearInterval(timers.move);
        timers.move = null;
        state.playerSprite = state.roomState.seated ? 'sit' : 'idle';
        syncCharacters();
        if (onComplete) onComplete();
      }
    }, 28);
  }

  function onCharTap({ id }) {
    if (id !== 'kiki') return;
    // 落座锁：坐着不与同伴互动（只能点沙发站起）
    if (state.roomState.seated) {
      flashAction('你正坐在沙发上 · 点击沙发站起后才能互动');
      return;
    }
    const dx = state.player.left - state.peer.left;
    const dy = state.player.top - state.peer.top;
    if (Math.sqrt(dx * dx + dy * dy) > 22) {
      showToast({ title: '走近一点再互动吧', icon: 'none' });
      const target = map.resolveTarget(state.player, { left: state.peer.left - 12, top: state.peer.top + 8 });
      moveAlongPath(state.player, target);
      return;
    }
    showActionSheet({ itemList: ['挥手打招呼', '击掌', '一起听歌'] }).then((res) => {
      if (res.cancelled || res.tapIndex < 0) return;
      const labels = ['已向 KIKI 挥手', '和 KIKI 击掌成功', '已邀请 KIKI 一起听歌'];
      flashAction(labels[res.tapIndex]);
      RoomSync.sendAction(labels[res.tapIndex]);
    });
  }

  function doJoin() {
    RoomSync.join({
      room: '0731',
      name: 'MOMO',
      peerBase: { left: state.peer.left, top: state.peer.top },
      handlers: {
        onJoined: () => {
          state.syncOnline = true;
          livePill.textContent = '● 正在播放 · LIVE 已连线';
          // 进房即广播当前曲目，后加入的人也能拿到"正在播哪首"
          broadcastPlayer(Player.snapshot());
        },
        onOffline: () => {
          state.syncOnline = false;
          livePill.textContent = '● 正在播放 · LIVE';
        },
        onPeerPlayer: (msg) => applyPeerPlayer(msg),
        onPeerMove: (msg) => animatePeer(msg),
        onPeerState: (msg) => applyPeerState(msg),
        onPeerAction: (msg) => flashAction(msg.label),
        onPeerJoin: (msg) => flashAction(`${msg.from} 走进了你的放映室`),
        onPeerLeave: (msg) => flashAction(`${msg.from} 离开了房间`)
      }
    });
  }

  // ---- 挂载：构建场景 ----
  scene = new RoomScene(stageWrap, {
    mode: 'interactive',
    characters: [],
    nowPlaying: state.nowPlaying,
    bubbles: state.bubbles,
    nearId: state.nearId,
    activeIds: state.activeIds,
    hint: state.showHint,
    onStageTap: onSceneTap,
    onFurnitureTap,
    onCharTap
  });
  refreshRoomConfig();
  syncCharacters();

  const unsubPlayer = Player.subscribe(onPlayerSnap);
  const unsubRoom = RoomStore.subscribe(() => refreshRoomConfig());
  timers.hint = setTimeout(() => {
    state.showHint = false;
    hintEl.remove();
    setSceneProps({ hint: false });
  }, 6000);
  doJoin();

  return {
    unmount() {
      RoomSync.leave();
      unsubPlayer();
      unsubRoom();
      Object.keys(timers).forEach((k) => {
        if (timers[k]) {
          clearInterval(timers[k]);
          clearTimeout(timers[k]);
          timers[k] = null;
        }
      });
      scene.destroy();
      miniPlayer.destroy();
      page.remove();
    }
  };
}

let ctx = null;

export default {
  mount(container) {
    ctx = mount(container);
  },
  unmount() {
    if (ctx) {
      ctx.unmount();
      ctx = null;
    }
  }
};
