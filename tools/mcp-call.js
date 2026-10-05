// 通用 wechatide MCP 调用器
// 用法: node mcp-call.js <tool> '<json-args>'   或   node mcp-call.js --schema <tool>
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

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line.startsWith('{')) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && handlers.has(msg.id)) {
        const h = handlers.get(msg.id);
        handlers.delete(msg.id);
        msg.error ? h.reject(new Error(JSON.stringify(msg.error))) : h.resolve(msg.result);
      } else if (msg.method) {
        console.error('[notify]', msg.method, JSON.stringify(msg.params || {}).slice(0, 200));
      }
    } catch (e) { /* ignore */ }
  }
});

(async () => {
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'roomie-cli', version: '1.0' }
  });
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

  const [tool, argStr] = process.argv.slice(2);
  if (tool === '--schema') {
    const tools = await send('tools/list', {});
    const t = (tools.tools || []).find((x) => x.name === argStr);
    console.log(JSON.stringify(t, null, 2));
  } else {
    const args = argStr ? JSON.parse(argStr) : {};
    const result = await send('tools/call', { name: tool, arguments: args });
    console.log(JSON.stringify(result, null, 2));
  }
  proc.kill();
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message);
  proc.kill();
  process.exit(1);
});

setTimeout(() => { console.error('TIMEOUT'); proc.kill(); process.exit(1); }, parseInt(process.env.MCP_TIMEOUT_MS || '60000'));
