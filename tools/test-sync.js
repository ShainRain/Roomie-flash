// sync-server 中继冒烟测试：起服务器 + 两个客户端互发 move/state/action
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

const server = spawn('node', [path.join(__dirname, 'sync-server.js')], { stdio: ['ignore', 'pipe', 'inherit'] });
server.stdout.on('data', (d) => process.stdout.write('[server] ' + d));

let passed = 0, failed = 0;
const assert = (c, n) => { c ? passed++ : failed++; console.log((c ? '  ✓ ' : '  ✗ ') + n); };

function client(name) {
  const ws = new WebSocket('ws://127.0.0.1:8765');
  const inbox = [];
  ws.on('message', (raw) => inbox.push(JSON.parse(raw)));
  ws.on('open', () => ws.send(JSON.stringify({ type: 'join', room: '0731', name })));
  return { ws, inbox };
}

setTimeout(() => {
  const a = client('MOMO');
  setTimeout(() => {
    const b = client('KIKI');
    setTimeout(() => {
      // A 发移动/状态/动作/播放状态
      a.ws.send(JSON.stringify({ type: 'move', left: 30, top: 60, direction: 'right', walking: true }));
      a.ws.send(JSON.stringify({ type: 'state', key: 'projectorOn', value: true, furnitureId: 'projector' }));
      a.ws.send(JSON.stringify({ type: 'action', label: '挥手' }));
      a.ws.send(JSON.stringify({ type: 'player', index: 1, position: 88, playing: true, sentAt: Date.now() }));

      setTimeout(() => {
        const aJoined = a.inbox.find((m) => m.type === 'joined');
        const bJoined = b.inbox.find((m) => m.type === 'joined');
        assert(!!aJoined, 'A 收到 joined');
        assert(bJoined && bJoined.members.length === 2, 'B 的 joined 含 2 名成员');
        assert(b.inbox.some((m) => m.type === 'move' && m.from === 'MOMO' && m.left === 30), 'B 收到 A 的 move（带 from）');
        assert(b.inbox.some((m) => m.type === 'state' && m.key === 'projectorOn'), 'B 收到 A 的 state');
        assert(b.inbox.some((m) => m.type === 'action' && m.label === '挥手'), 'B 收到 A 的 action');
        assert(b.inbox.some((m) => m.type === 'player' && m.index === 1 && m.playing === true), 'B 收到 A 的 player 播放状态');
        assert(!a.inbox.some((m) => m.type === 'move'), 'A 不收自己的 move（不回声）');
        assert(!a.inbox.some((m) => m.type === 'player'), 'A 不收自己的 player（不回声）');

        // 晚加入的 C 应收到房间缓存的播放状态
        const c = client('NANA');
        setTimeout(() => {
          assert(c.inbox.some((m) => m.type === 'player' && m.index === 1), 'C 加入即收到缓存的播放状态');

          // B 离开 → A 收到 peer-leave
          b.ws.close();
          setTimeout(() => {
            assert(a.inbox.some((m) => m.type === 'peer-leave' && m.from === 'KIKI'), 'A 收到 B 的 peer-leave');
            console.log(`\n结果：${passed} 通过，${failed} 失败`);
            a.ws.close();
            c.ws.close();
            server.kill();
            process.exit(failed ? 1 : 0);
          }, 300);
        }, 400);
      }, 400);
    }, 300);
  }, 300);
}, 500);

setTimeout(() => { console.error('TIMEOUT'); server.kill(); process.exit(1); }, 8000);
