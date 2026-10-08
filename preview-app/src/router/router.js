/**
 * Hash-based router — static-deploy friendly (no server rewrites needed).
 * Route params via query string: #/duo?peer=KIKI
 *
 * Pages are modules exposing mount(container, ctx) and optional unmount().
 * ctx = { params: URLSearchParams, path, query:Object, navigate }
 */

const routes = new Map();
let current = null; // { path, page, container }
let notFound = null;
let rootEl = null;
const listeners = new Set();

function parseHash() {
  const raw = (window.location.hash || '#/').replace(/^#/, '');
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const params = new URLSearchParams(queryPart || '');
  const query = {};
  params.forEach((v, k) => { query[k] = v; });
  return { path, params, query };
}

export function register(path, page) {
  routes.set(path, page);
}

export function setNotFound(page) {
  notFound = page;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitChange(path) {
  listeners.forEach((fn) => {
    try { fn(path); } catch (e) { console.error('[router] listener error', e); }
  });
}

async function render() {
  if (!rootEl) return;
  const { path, params, query } = parseHash();
  const page = routes.get(path) || notFound;
  if (current && current.page && typeof current.page.unmount === 'function') {
    try { current.page.unmount(); } catch (e) { console.error('[router] unmount error', e); }
  }
  // wx 语义：路由切换即丢弃全局浮层（toast/modal/actionSheet 不跨页存活）
  const overlay = document.getElementById('wx-overlay-root');
  if (overlay) overlay.innerHTML = '';
  rootEl.innerHTML = '';
  if (page && typeof page.mount === 'function') {
    await page.mount(rootEl, { params, query, path, navigate });
  }
  current = { path, page };
  emitChange(path);
}

export function navigate(url, { replace = false } = {}) {
  // url like '#/room' or '/room?x=1'
  const hash = url.startsWith('#') ? url : `#${url}`;
  if (replace) {
    const base = window.location.href.split('#')[0];
    window.location.replace(`${base}${hash}`);
  } else {
    window.location.hash = hash;
  }
}

export function back() {
  window.history.back();
}

export function currentPath() {
  return parseHash().path;
}

export function start(root) {
  rootEl = root;
  window.addEventListener('hashchange', render);
  if (!window.location.hash) window.location.hash = '#/';
  render();
}

export default { register, setNotFound, onChange, navigate, back, currentPath, start };
