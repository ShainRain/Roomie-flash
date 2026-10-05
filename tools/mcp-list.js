// 极简 MCP stdio 客户端（NDJSON 版）：列出 wechatide mcp 的工具
const { spawn } = require('child_process');

const token = process.env.WECHATIDE_MCP_TOKEN;
if (!token) {
  console.error('Set WECHATIDE_MCP_TOKEN before running this script.');
  process.exit(1);
}

const proc = spawn(
  `"C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\wechatide.cmd" mcp --token=${token}`,
  { stdio: ['pipe', 'pipe', 'inherit'], shell: true }
);

let buf = '';
const handlers = new Map();
let id = 0;

function send(method, params) {
  return new Promise((resolve, reject) => {
    handlers.set(++id, { resolve, reject });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function notify(method, params) {
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line.startsWith('{')) {
      if (line) console.log('[bridge]', line.slice(0, 120));
      continue;
    }
    try {
      const msg = JSON.parse(line);
      if (msg.id && handlers.has(msg.id)) {
        const h = handlers.get(msg.id);
        handlers.delete(msg.id);
        msg.error ? h.reject(new Error(JSON.stringify(msg.error))) : h.resolve(msg.result);
      }
    } catch (e) { /* ignore */ }
  }
});

(async () => {
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'roomie-cli', version: '1.0' }
  });
  console.log('server:', JSON.stringify(init.serverInfo || {}));
  notify('notifications/initialized', {});
  const tools = await send('tools/list', {});
  for (const t of tools.tools || []) {
    console.log(`- ${t.name}: ${(t.description || '').slice(0, 120)}`);
  }
  proc.kill();
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message);
  proc.kill();
  process.exit(1);
});

setTimeout(() => { console.error('TIMEOUT'); proc.kill(); process.exit(1); }, 25000);
