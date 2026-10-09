// state/messages.js 纯逻辑断言：分类映射 / 筛选 / 未读数 / 邀请状态迁移 / 持久化读写
// （消息页 DOM 之外的独立可验证逻辑；mock 数据，无后端）
import {
  MESSAGE_CATEGORIES, MESSAGES, READ_KEY, INVITE_STATES_KEY,
  categoryOf, filterByCategory, countUnread,
  loadReadIds, saveReadIds, loadInviteStates, saveInviteStates,
  applyInviteStates, decideInvite, inviteStatusLabel
} from '../src/state/messages.js';

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

// 内存版 storage adapter（语义对齐 adapters/storage.js：get 缺失返回 ''）
function makeStorage() {
  const data = new Map();
  return {
    get(key) { return data.has(key) ? data.get(key) : ''; },
    set(key, value) { data.set(key, value); },
    data
  };
}

// 1. 分类映射
const pendingInvite = { id: 1, type: 'invite', status: 'pending' };
const acceptedInvite = { id: 1, type: 'invite', status: 'accepted' };
const declinedInvite = { id: 1, type: 'invite', status: 'declined' };
assert(categoryOf(pendingInvite) === 'pending', '待回应邀请 → 待回应');
assert(categoryOf(acceptedInvite) === 'feed', '已接受邀请 → 房间动态（历史事件）');
assert(categoryOf(declinedInvite) === 'feed', '已拒绝邀请 → 房间动态（历史事件）');
assert(categoryOf({ type: 'share' }) === 'media', '唱片分享 → 唱片与明信片');
assert(categoryOf({ type: 'postcard' }) === 'media', '明信片 → 唱片与明信片');
assert(categoryOf({ type: 'event' }) === 'feed', '房间动态 → 房间动态');
assert(MESSAGE_CATEGORIES.length === 4 && MESSAGE_CATEGORIES[0].id === 'all', '四个分类，首项为全部');

// 2. 分类筛选（初始 mock：无持久化决定 → 1 条待回应邀请）
assert(filterByCategory(MESSAGES, 'all').length === MESSAGES.length, '全部 = 完整列表');
assert(filterByCategory(MESSAGES, 'pending').length === 1 && filterByCategory(MESSAGES, 'pending')[0].id === 1,
  '待回应 = 待处理的 KIKI 邀请');
assert(filterByCategory(MESSAGES, 'media').length === 2, '唱片与明信片 = 分享 + 明信片');
assert(filterByCategory(MESSAGES, 'feed').length === 3, '房间动态 = 3 条事件');
assert(filterByCategory(MESSAGES, 'all') !== MESSAGES, '筛选返回新数组');

// 3. 未读数
assert(countUnread(MESSAGES) === 3, '初始未读 3 条（邀请/事件/分享）');
assert(countUnread(MESSAGES.map((m) => ({ ...m, unread: false }))) === 0, '全部已读 → 0');

// 4. 已读集合读写（roomie_messages_read）
const store = makeStorage();
const withRead = MESSAGES.map((m) => ({ ...m, unread: m.id !== 1 && m.id !== 5 }));
saveReadIds(store.set, withRead);
assert(JSON.stringify(store.data.get(READ_KEY)) === '[1,5]', '已读 id 持久化为数组');
const readBack = loadReadIds(store.get);
assert(readBack.has(1) && readBack.has(5) && !readBack.has(2), '已读集合可回读');
const emptyStore = makeStorage();
assert(loadReadIds(emptyStore.get).size === 0, '无存档 → 空已读集合');
const badStore = makeStorage();
badStore.set(READ_KEY, 'oops');
assert(loadReadIds(badStore.get).size === 0, '损坏存档 → 空已读集合（不抛错）');

// 5. 邀请决定读写（roomie_invite_states）
const istore = makeStorage();
saveInviteStates(istore.set, { 1: 'accepted', 2: 'declined' });
assert(JSON.stringify(loadInviteStates(istore.get)) === '{"1":"accepted","2":"declined"}', '邀请决定可回读');
const badIstore = makeStorage();
badIstore.set(INVITE_STATES_KEY, [1, 2, 3]);
assert(JSON.stringify(loadInviteStates(badIstore.get)) === '{}', '数组形态存档 → 忽略');
badIstore.set(INVITE_STATES_KEY, { 1: 'maybe', 2: 'accepted', x: 'declined' });
assert(JSON.stringify(loadInviteStates(badIstore.get)) === '{"2":"accepted"}', '非法决定值/非法键被过滤');

// 6. 应用持久化决定：已处理邀请不再未读、不再待回应
const applied = applyInviteStates(MESSAGES, { 1: 'accepted' });
const a1 = applied.find((m) => m.id === 1);
assert(a1.status === 'accepted' && a1.unread === false, '已接受邀请：status 挂上 + 不再未读');
const pendingApplied = applyInviteStates(MESSAGES, {});
const p1 = pendingApplied.find((m) => m.id === 1);
assert(p1.status === 'pending' && p1.unread === true, '无决定时邀请保持待回应 + 未读');
const feedAfter = filterByCategory(applied, 'feed');
assert(!feedAfter.some((m) => m.id === 1 && m.status === 'pending'), '已接受邀请不再出现在待回应');

// 7. 邀请状态迁移：幂等 + 校验
const base = applyInviteStates(MESSAGES, {});
let res = decideInvite(base, 1, 'accepted');
assert(res.ok && res.next.find((m) => m.id === 1).status === 'accepted', 'pending → accepted 成功');
assert(res.next !== base && base.find((m) => m.id === 1).status === 'pending', '迁移返回新数组，不改动入参');
res = decideInvite(base, 1, 'accepted');
res = decideInvite(res.next, 1, 'accepted');
assert(!res.ok && res.reason === 'already-decided', '重复接受被拦截（不会重复创建邀请）');
res = decideInvite(base, 1, 'declined');
assert(res.ok && res.next.find((m) => m.id === 1).status === 'declined', 'pending → declined 成功');
res = decideInvite(base, 1, 'maybe');
assert(!res.ok && res.reason === 'invalid-decision', '非法决定值被拒绝');
res = decideInvite(base, 3, 'accepted');
assert(!res.ok && res.reason === 'not-found', '非邀请消息不可决定');
assert(inviteStatusLabel('accepted') === '已接受' && inviteStatusLabel('declined') === '已婉拒' && inviteStatusLabel('pending') === '待回应',
  '状态文案：待回应/已接受/已婉拒');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
