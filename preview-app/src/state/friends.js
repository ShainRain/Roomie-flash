/**
 * Friend list data — port of the hardcoded friend data from
 * miniprogram/pages/friends + pages/home, with online/offline and invite flow state.
 *
 * 每位在线好友带一个 roomie_room 兼容的 `room`（floor/lightTemp/lightBright/furniture，
 * 后续 Room/Duo 可直接消费）与一个 vignette `variant`：
 * variant 语义对齐 tools/gen-friends-vignettes.js —— 整体 hue/sat/bright 微调 +
 * 角色换色（char + charFilter ≈ modulate hue/saturation），不重画家具。
 */

const DEFAULT_FURNITURE = ['sofa', 'vinyl-player', 'lamp', 'plant', 'rug', 'projector', 'guitar', 'bookshelf', 'coffee'];

// 角色站位与 gen-friends-vignettes.js CHAR_FOOT (300,500)/828 一致；
// 尺寸/遮挡沿用该工具的 plan（GEO.characters.momo: heightPx 124 → scale 0.969, z 670 > 茶几 613，角色在茶几前）
export const VIGNETTE_CHAR_AT = { x: 36.23, y: 60.39 };
export const VIGNETTE_CHAR_PLAN = { scale: 0.969, z: 670 };

export const FRIENDS_ONLINE = [
  {
    name: 'KIKI', color: '#F5B83D', status: '在你的房间 · 一起听', nowPlaying: true, tag: '房间中', action: '进入', type: 'enter',
    room: { floor: 'walnut', lightTemp: 2700, lightBright: 100, furniture: DEFAULT_FURNITURE },
    variant: { filter: 'saturate(1.05)', char: 'kiki', charFilter: '' }
  },
  {
    name: 'NANA', color: '#7FB5E8', status: '正在听', nowPlaying: true, tag: '', action: '邀请', type: 'invite',
    room: { floor: 'blue-gray', lightTemp: 3900, lightBright: 100, furniture: DEFAULT_FURNITURE.filter((f) => f !== 'guitar') },
    variant: { filter: 'hue-rotate(-14deg)', char: 'momo', charFilter: 'hue-rotate(175deg)' }
  },
  {
    name: 'ABO', color: '#E8734A', status: '正在逛唱片墙', nowPlaying: false, tag: '', action: '邀请', type: 'invite',
    room: { floor: 'walnut', lightTemp: 2700, lightBright: 100, furniture: DEFAULT_FURNITURE.filter((f) => f !== 'plant') },
    variant: { filter: 'hue-rotate(8deg) saturate(1.06) brightness(1.02)', char: 'momo', charFilter: 'hue-rotate(-12deg)' }
  }
];

export const FRIENDS_OFFLINE = [
  {
    name: 'RITA', color: '#C9CDD4', status: '2 小时前听过《花海》', action: '邀请', type: 'offline',
    room: { floor: 'walnut', lightTemp: 2700, lightBright: 100, furniture: DEFAULT_FURNITURE },
    variant: { filter: 'hue-rotate(-8deg) saturate(0.55) brightness(0.62)', char: 'momo', charFilter: 'saturate(0.15)' }
  },
  {
    name: 'TAO', color: '#C9CDD4', status: '昨天布置了唱片墙', action: '邀请', type: 'offline',
    room: { floor: 'slate', lightTemp: 2700, lightBright: 100, furniture: DEFAULT_FURNITURE },
    variant: { filter: 'hue-rotate(4deg) saturate(0.5) brightness(0.58)', char: 'momo', charFilter: 'saturate(0.12)' }
  }
];

// Home 页在线条带用的精简视图
export const HOME_FRIENDS = [
  { name: 'KIKI', color: '#F5B83D', status: '正在听《晴天》' },
  { name: 'NANA', color: '#7FB5E8', status: '正在逛唱片墙' },
  { name: 'ABO', color: '#E8734A', status: '在房间里发呆' }
];

// ---- invite flow state (module-level, matches pages/friends inviting semantics) ----
let inviting = '';
let inviteTimer = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try { fn(inviting); } catch (e) { console.error('[friends] listener error', e); }
  });
}

export function getInviting() {
  return inviting;
}

export function subscribeInviting(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Start an invite to `name`; resolves with the accepted friend's name after a
 * simulated accept delay. Returns null if another invite is already in flight.
 */
export function invite(name, { delay = 1600 } = {}) {
  if (inviting) return null;
  inviting = name;
  emit();
  return new Promise((resolve) => {
    inviteTimer = setTimeout(() => {
      inviteTimer = null;
      const accepted = inviting;
      inviting = '';
      emit();
      resolve(accepted);
    }, delay);
  });
}

export function cancelInvite() {
  if (inviteTimer) {
    clearTimeout(inviteTimer);
    inviteTimer = null;
  }
  if (inviting) {
    inviting = '';
    emit();
  }
}

export default { FRIENDS_ONLINE, FRIENDS_OFFLINE, HOME_FRIENDS, getInviting, subscribeInviting, invite, cancelInvite };
