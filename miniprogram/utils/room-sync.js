/**
 * Roomie 房间同步客户端
 * - wx.connectSocket 连接本地中继（tools/sync-server.js）
 * - 断线/连接失败自动回退为"模拟 peer"（偶尔游走），页面对连接状态无感知
 * - 真机演示时把 HOST 改为电脑局域网 IP（手机与电脑需同网段）
 * - 连接生命周期：单实例 + connecting 守卫，join() 幂等；旧 socket 的事件不再改变状态
 */

// 开发者工具模拟器用 127.0.0.1；真机预览改成局域网 IP，如 192.168.x.x
const HOST = '127.0.0.1';
const PORT = 8765;
const MOVE_THROTTLE = 150;

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
    socket.send({ data: JSON.stringify(pendingMove) });
    pendingMove = null;
  }
}

function send(obj) {
  if (status !== 'online' || !socket) return;
  socket.send({ data: JSON.stringify(obj) });
}

function startSimPeer() {
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

function stopSimPeer() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
}

function connect() {
  status = 'connecting';
  let sock;
  try {
    sock = wx.connectSocket({ url: `ws://${HOST}:${PORT}` });
  } catch (e) {
    degrade();
    return;
  }
  socket = sock;

  sock.onOpen(() => {
    if (sock !== socket) return; // 旧连接事件，忽略
    sock.send({ data: JSON.stringify({ type: 'join', room: myRoom, name: myName }) });
  });

  sock.onMessage((res) => {
    if (sock !== socket) return;
    let msg;
    try { msg = JSON.parse(res.data); } catch { return; }
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
  sock.onClose(onDead);
  sock.onError(onDead);
}

function degrade() {
  status = 'idle';
  socket = null;
  startSimPeer();
  if (handlers.onOffline) handlers.onOffline();
}

// 幂等：已连线或连接中只更新事件处理，不重复建连（避免 onLoad/onShow 竞争）
function join(options) {
  handlers = options.handlers || {};
  myName = options.name || 'MOMO';
  myRoom = options.room || '0731';
  if (options.peerBase) simPos = { ...options.peerBase };
  if (status !== 'idle') return;
  startSimPeer(); // 连接建立前先由模拟 peer 兜底
  connect();
}

function sendMove(pos) {
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

function sendState(patch) {
  send({ type: 'state', ...patch });
}

// 播放器状态同步：{ index, position, playing }，附发送时间戳供对端补偿延迟
function sendPlayer(state) {
  send({ type: 'player', ...state, sentAt: Date.now() });
}

function sendAction(label) {
  send({ type: 'action', label });
}

function leave() {
  stopSimPeer();
  if (moveFlushTimer) {
    clearTimeout(moveFlushTimer);
    moveFlushTimer = null;
  }
  const sock = socket;
  socket = null;
  status = 'idle';
  if (sock) {
    try { sock.close({}); } catch (e) { /* ignore */ }
  }
  handlers = {};
}

function isOnline() {
  return status === 'online';
}

module.exports = { join, sendMove, sendState, sendPlayer, sendAction, leave, isOnline };
