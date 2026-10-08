/**
 * Friend list data — port of the hardcoded friend data from
 * miniprogram/pages/friends + pages/home, with online/offline and invite flow state.
 */
export const FRIENDS_ONLINE = [
  { name: 'KIKI', color: '#F5B83D', status: '在你的房间 · 一起听《晴天》', tag: '房间中', action: '进入', type: 'enter', vignette: '/assets/img/vignette-kiki.webp' },
  { name: 'NANA', color: '#7FB5E8', status: '正在听《晴天》', tag: '', action: '邀请', type: 'invite', vignette: '/assets/img/vignette-nana.webp' },
  { name: 'ABO', color: '#E8734A', status: '正在逛唱片墙', tag: '', action: '邀请', type: 'invite', vignette: '/assets/img/vignette-abo.webp' }
];

export const FRIENDS_OFFLINE = [
  { name: 'RITA', color: '#C9CDD4', status: '2 小时前听过《花海》', action: '邀请', type: 'invite' },
  { name: 'TAO', color: '#C9CDD4', status: '昨天布置了唱片墙', action: '邀请', type: 'invite' }
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
