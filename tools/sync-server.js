// Roomie 房间同步中继服务器（演示用，本地局域网）
// 启动：node tools/sync-server.js  （依赖 tools/node_modules 里的 ws）
// 协议（JSON）：
//   C→S  join   { type:'join', room, name }
//   C→S  move   { type:'move', left, top, direction, walking, sprite }
//   C→S  state  { type:'state', key, value, furnitureId }   // 家具/房间状态
//   C→S  player { type:'player', index, position, playing, sentAt } // 播放器状态（房间级缓存，新加入者补发）
//   C→S  action { type:'action', label }                    // 互动动作（挥手/击掌…）
//   S→C  joined { type:'joined', clientId, members:[{id,name}] }
//   S→C  peer-join / peer-leave / move / state / player / action（均带 from 名字）
const WebSocket = require('ws');

const PORT = 8765;
const wss = new WebSocket.Server({ port: PORT });
const rooms = new Map(); // room -> Map<clientId, {ws, name}>
const lastPlayer = new Map(); // room -> 最近一次播放器状态（供新加入者同步）
let nextId = 1;

function roomOf(name) {
  if (!rooms.has(name)) rooms.set(name, new Map());
  return rooms.get(name);
}

function broadcast(room, fromId, msg) {
  const members = rooms.get(room);
  if (!members) return;
  const raw = JSON.stringify(msg);
  for (const [id, m] of members) {
    if (id !== fromId && m.ws.readyState === 1) m.ws.send(raw);
  }
}

wss.on('connection', (ws) => {
  const clientId = 'c' + nextId++;
  let room = null;
  let name = '匿名';
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      room = String(msg.room || '0731');
      name = String(msg.name || '匿名').slice(0, 12);
      const members = roomOf(room);
      members.set(clientId, { ws, name });
      ws.send(JSON.stringify({
        type: 'joined',
        clientId,
        members: [...members].map(([id, m]) => ({ id, name: m.name }))
      }));
      broadcast(room, clientId, { type: 'peer-join', from: name });
      // 新加入者补发房间当前播放状态（如有）
      const cached = lastPlayer.get(room);
      if (cached) ws.send(JSON.stringify({ ...cached, from: '__cache' }));
      console.log(`[join] ${name} -> room ${room}（${members.size} 人）`);
      return;
    }

    if (!room) return;
    if (msg.type === 'player') {
      lastPlayer.set(room, { ...msg, from: name });
      broadcast(room, clientId, { ...msg, from: name });
      return;
    }
    if (msg.type === 'move' || msg.type === 'state' || msg.type === 'action') {
      broadcast(room, clientId, { ...msg, from: name });
    }
  });

  ws.on('close', () => {
    if (room && rooms.has(room)) {
      rooms.get(room).delete(clientId);
      broadcast(room, clientId, { type: 'peer-leave', from: name });
      console.log(`[leave] ${name} <- room ${room}`);
      if (rooms.get(room).size === 0) rooms.delete(room);
    }
  });
});

// 心跳：清理僵死连接
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

console.log(`Roomie sync server listening on ws://0.0.0.0:${PORT}`);
