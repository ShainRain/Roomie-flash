/**
 * Roomie 房间同步客户端 — Web port of miniprogram/utils/room-sync.js
 * - WebSocket connects to the local relay (tools/sync-server.js) when available
 * - 断线/连接失败自动回退为"模拟 peer"（偶尔游走），页面对连接状态无感知
 * - DEFAULT MODE = simPeer (no server): set RoomSync.MODE='websocket' or pass
 *   { mode: 'websocket' } to join() to attempt a real connection.
 * - 连接生命周期：单实例 + connecting 守卫，join() 幂等；旧 socket 的事件不再改变状态
 */

const HOST = '127.0.0.1';
const PORT = 8765;
const MOVE_THROTTLE = 150;

export let MODE = 'simPeer'; // 'simPeer' | 'websocket'

let socket = null;
let status = 'idle'; // idle | connecting | online
let handlers = {};
let myName = '';
let myRoom = '';
let lastMoveSent = 0;
let pendingMove = null;
let moveFlushTimer = null;
let simTimer = null;
let simPos = { left: 52, top: 64 };

function flushMove() {
  moveFlushTimer = null;
  if (pendingMove && status === 'online' && socket) {
    socket.send(JSON.stringify(pendingMove));
    pendingMove = null;
  }
}

function send(obj) {
  if (status !== 'online' || !socket) return;
  socket.send(JSON.stringify(obj));
}

export function startSimPeer() {
  if (simTimer) return;
  simTimer = setInterval(() => {
    // 模拟 peer 在当前位置附近游走
    simPos = {
      left: Math.max(24, Math.min(78, simPos.left + (Math.random() * 16 - 8))),
      top: Math.max(52, Math.min(82, simPos.top + (Math.random() * 12 - 6)))
    };
    if (handlers.onPeerMove) {
      handlers.onPeerMove({
        left: simPos.left,
        top: simPos.top,
        direction: Math.random() > 0.5 ? 'left' : 'right',
        walking: true,
        sprite: Math.random() > 0.5 ? 'walk-a' : 'walk-b'
      });
    }
  }, 4000);
}

// ---- 模拟 peer 的播放器活动（duo 演示用，opt-in）----
// 消息形状与 room-sync 'player' 协议一致：{ index, position, playing, sentAt }，
// 页面侧经 Player.applyRemote 应用（source='remote'，不回播）。
let simPlayerTimer = null;
let simPlayerGetSnap = null;
let simPlayerCount = 0;

function startSimPlayerActivity() {
  if (simPlayerTimer || typeof simPlayerGetSnap !== 'function') return;
  const act = () => {
    const snap = simPlayerGetSnap();
    if (!snap || !handlers.onPeerPlayer) return;
    simPlayerCount += 1;
    if (!snap.playing) {
      // 对端放上了唱片
      handlers.onPeerPlayer({ index: snap.index, position: snap.position, playing: true, sentAt: Date.now() });
      if (handlers.onPeerAction) handlers.onPeerAction({ label: '对方放上了唱片' });
      return;
    }
    // 每两次活动切一次歌（演示节奏克制）
    if (simPlayerCount % 2 === 0) {
      handlers.onPeerPlayer({ index: (snap.index + 1) % snap.playlistLength, position: 0, playing: true, sentAt: Date.now() });
      if (handlers.onPeerAction) handlers.onPeerAction({ label: '对方换了一张唱片' });
    }
  };
  // 首次 12s（进房不久即有同步感），之后每 24s
  simPlayerTimer = setTimeout(function loop() {
    act();
    simPlayerTimer = setTimeout(loop, 24000);
  }, 12000);
}

function stopSimPlayerActivity() {
  if (simPlayerTimer) {
    clearTimeout(simPlayerTimer);
    simPlayerTimer = null;
  }
  simPlayerCount = 0;
}

export function stopSimPeer() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
}

function connect() {
  status = 'connecting';
  let sock;
  try {
    sock = new WebSocket(`ws://${HOST}:${PORT}`);
  } catch (e) {
    degrade();
    return;
  }
  socket = sock;

  sock.addEventListener('open', () => {
    if (sock !== socket) return; // 旧连接事件，忽略
    sock.send(JSON.stringify({ type: 'join', room: myRoom, name: myName }));
  });

  sock.addEventListener('message', (ev) => {
    if (sock !== socket) return;
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type === 'joined') {
      status = 'online';
      stopSimPeer();
      if (handlers.onJoined) handlers.onJoined(msg);
      if (handlers.onRoster) handlers.onRoster(msg.members);
    } else if (msg.type === 'move' && handlers.onPeerMove) {
      handlers.onPeerMove(msg);
    } else if (msg.type === 'state' && handlers.onPeerState) {
      handlers.onPeerState(msg);
    } else if (msg.type === 'player' && handlers.onPeerPlayer) {
      handlers.onPeerPlayer(msg);
    } else if (msg.type === 'action' && handlers.onPeerAction) {
      handlers.onPeerAction(msg);
    } else if (msg.type === 'peer-join' && handlers.onPeerJoin) {
      handlers.onPeerJoin(msg);
    } else if (msg.type === 'peer-leave' && handlers.onPeerLeave) {
      handlers.onPeerLeave(msg);
    }
  });

  const onDead = () => {
    if (sock !== socket) return; // 只有当前连接允许改变状态
    degrade();
  };
  sock.addEventListener('close', onDead);
  sock.addEventListener('error', onDead);
}

function degrade() {
  status = 'idle';
  socket = null;
  startSimPeer();
  if (handlers.onOffline) handlers.onOffline();
}

// 幂等：已连线或连接中只更新事件处理，不重复建连
// options.simPlayer: 可选，() => Player.snapshot()——duo 页传入以开启模拟 peer 播放活动
export function join(options = {}) {
  handlers = options.handlers || {};
  myName = options.name || 'MOMO';
  myRoom = options.room || '0731';
  if (options.peerBase) simPos = { ...options.peerBase };
  simPlayerGetSnap = typeof options.simPlayer === 'function' ? options.simPlayer : null;
  if (status !== 'idle') return;
  startSimPeer(); // 连接建立前先由模拟 peer 兜底
  startSimPlayerActivity();
  const mode = options.mode || MODE;
  if (mode === 'websocket') connect();
}

export function sendMove(pos) {
  const msg = { type: 'move', ...pos };
  const now = Date.now();
  if (now - lastMoveSent >= MOVE_THROTTLE) {
    lastMoveSent = now;
    send(msg);
  } else {
    pendingMove = msg;
    if (!moveFlushTimer) moveFlushTimer = setTimeout(flushMove, MOVE_THROTTLE);
  }
}

export function sendState(patch) {
  send({ type: 'state', ...patch });
}

// 播放器状态同步：{ index, position, playing }，附发送时间戳供对端补偿延迟
export function sendPlayer(state) {
  send({ type: 'player', ...state, sentAt: Date.now() });
}

export function sendAction(label) {
  send({ type: 'action', label });
}

export function leave() {
  stopSimPeer();
  stopSimPlayerActivity();
  simPlayerGetSnap = null;
  if (moveFlushTimer) {
    clearTimeout(moveFlushTimer);
    moveFlushTimer = null;
  }
  const sock = socket;
  socket = null;
  status = 'idle';
  if (sock) {
    try { sock.close(); } catch (e) { /* ignore */ }
  }
  handlers = {};
}

export function isOnline() {
  return status === 'online';
}

export default { join, sendMove, sendState, sendPlayer, sendAction, leave, isOnline, startSimPeer, stopSimPeer };
