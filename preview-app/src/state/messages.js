/**
 * messages — 消息页数据模型与纯逻辑（mock，无后端）。
 *
 * 页面职责：「谁向我发来了什么，我需要回应什么」——邀请待办、唱片分享、
 * 明信片留言、房间互动事件。好友在线状态/好友房间只在好友页，不进这里。
 *
 * 持久化（复用现有 storage adapter 约定）：
 * - roomie_messages_read：已读消息 id 数组（既有键，语义不变）
 * - roomie_unread：当前未读数（tabbar 角标唯一来源）
 * - roomie_invite_states：邀请决定 { [msgId]: 'accepted' | 'declined' }（本模块新增，
 *   仅页面状态，不改消息 schema）
 *
 * 可独立验证的逻辑全部收敛为纯函数，供 tests/messages.test.mjs 直接引用。
 */

export const READ_KEY = 'roomie_messages_read';
export const INVITE_STATES_KEY = 'roomie_invite_states';

export const MESSAGE_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待回应' },
  { id: 'media', label: '唱片与明信片' },
  { id: 'feed', label: '房间动态' }
];

// mock 互动收件箱（事件类型化；时间近→远排列；唱片 recordId 与 state/records.js 同一数据源）
export const MESSAGES = [
  { id: 1, type: 'invite', from: 'KIKI', color: '#F5B83D', title: '邀请你一起听《Peaceful》', body: '这首像在海边慢慢醒来，来我的放映室一起听完整版。', recordId: 25, time: '刚刚', unread: true },
  { id: 2, type: 'event', from: 'NANA', color: '#7FB5E8', title: '接受了你的邀请，已进入你的放映室', time: '12 分钟前', unread: true, action: { kind: 'room', label: '进入房间' } },
  { id: 5, type: 'share', from: 'RITA', color: '#C9CDD4', title: '向你推荐了《夜航》', quote: '适合雨天听，前奏一响人就静下来了。', recordId: 1, time: '32 分钟前', unread: true },
  { id: 3, type: 'event', from: 'ABO', color: '#E8734A', title: '在你的唱片墙前停留了 5 分钟', time: '2 小时前', unread: false, action: { kind: 'records', label: '看看唱片墙' } },
  { id: 6, type: 'postcard', from: 'NANA', color: '#7FB5E8', title: '给你寄了一张明信片', preview: '你房间新换的胡桃木地板很好看。昨晚 loop 到《夜航》时突然想到你……', time: '昨晚', unread: false,
    content: 'MOMO：你房间新换的胡桃木地板很好看。昨晚 loop 到《夜航》的时候突然想起你说想在天台搭一间放映室——别拖了，这周末就去。等你回信。—— NANA（深夜放映室 · 0426）' },
  { id: 4, type: 'event', from: 'RITA', color: '#C9CDD4', title: '收藏了你分享的《夜航》', time: '昨天', unread: false, action: { kind: 'records-focus', recordId: 1, label: '查看唱片' } }
];

/** 单条消息所属的分类 */
export function categoryOf(msg) {
  if (msg.type === 'invite') return msg.status && msg.status !== 'pending' ? 'feed' : 'pending';
  if (msg.type === 'share' || msg.type === 'postcard') return 'media';
  return 'feed'; // event
}

/** 按分类筛选；'all' 返回全部（新数组） */
export function filterByCategory(messages, category) {
  if (category === 'all') return messages.slice();
  return messages.filter((m) => categoryOf(m) === category);
}

/** 未读数（tabbar 角标 = 该值） */
export function countUnread(messages) {
  return messages.filter((m) => m.unread).length;
}

/** 已读集合读写（roomie_messages_read，id 数组） */
export function loadReadIds(storageGet) {
  const raw = storageGet(READ_KEY);
  return Array.isArray(raw) ? new Set(raw.filter((id) => typeof id === 'number')) : new Set();
}

export function saveReadIds(storageSet, messages) {
  storageSet(READ_KEY, messages.filter((m) => !m.unread).map((m) => m.id));
}

/** 邀请决定读写（roomie_invite_states，{ [id]: 'accepted' | 'declined' }） */
export function loadInviteStates(storageGet) {
  const raw = storageGet(INVITE_STATES_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  Object.keys(raw).forEach((k) => {
    const id = Number(k);
    if (Number.isInteger(id) && (raw[k] === 'accepted' || raw[k] === 'declined')) out[id] = raw[k];
  });
  return out;
}

export function saveInviteStates(storageSet, states) {
  storageSet(INVITE_STATES_KEY, { ...states });
}

/**
 * 应用持久化的邀请决定：attach status（缺省 'pending'）。
 * 已有决定的邀请视为已处理 —— 不再算未读、不再进「待回应」。
 */
export function applyInviteStates(messages, states) {
  return messages.map((m) => {
    if (m.type !== 'invite') return m;
    const status = states[m.id] || 'pending';
    return { ...m, status, unread: status === 'pending' ? m.unread : false };
  });
}

/**
 * 邀请状态迁移（纯函数）：pending → accepted / declined。
 * 重复决定返回 { ok: false, reason: 'already-decided' } 且不产生新数组 ——
 * 保证不会「重复接受后不断重复创建同一邀请」。
 */
export function decideInvite(messages, id, decision) {
  const msg = messages.find((m) => m.id === id && m.type === 'invite');
  if (!msg) return { ok: false, reason: 'not-found', next: messages };
  if (msg.status && msg.status !== 'pending') return { ok: false, reason: 'already-decided', next: messages };
  if (decision !== 'accepted' && decision !== 'declined') return { ok: false, reason: 'invalid-decision', next: messages };
  return { ok: true, next: messages.map((m) => (m.id === id ? { ...m, status: decision } : m)) };
}

/** 决定后的卡片状态文案 */
export function inviteStatusLabel(status) {
  if (status === 'accepted') return '已接受';
  if (status === 'declined') return '已婉拒';
  return '待回应';
}

export default {
  READ_KEY, INVITE_STATES_KEY, MESSAGE_CATEGORIES, MESSAGES,
  categoryOf, filterByCategory, countUnread,
  loadReadIds, saveReadIds, loadInviteStates, saveInviteStates,
  applyInviteStates, decideInvite, inviteStatusLabel
};
