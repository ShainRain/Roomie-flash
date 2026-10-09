// state/record-pick.js 纯逻辑断言：唱片墙选择草稿的清洗与点选切换
// （records 页 / profile 页共用；roomie_records 存储 schema = 数字 id 数组）
import { sanitizeSelection, toggleSelection } from '../src/state/record-pick.js';
import { RECORDS, MAX_PICK, DEFAULT_SELECTION, readSelection } from '../src/state/records.js';

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

const OPTS = { maxPick: MAX_PICK, maxId: RECORDS.length };

// 1. sanitizeSelection：非法 id 过滤 / 去重 / 截断
assert(JSON.stringify(sanitizeSelection([1, 2, 3], OPTS)) === '[1,2,3]', '合法数组原样保留');
assert(JSON.stringify(sanitizeSelection([1, 1, 2, 2, 3], OPTS)) === '[1,2,3]', '重复 id 按首次出现去重');
assert(JSON.stringify(sanitizeSelection([0, -1, 26, 99, 3], OPTS)) === '[3]', '越界/非正 id 被过滤（1..25 合法）');
assert(JSON.stringify(sanitizeSelection([1.5, '2', null, undefined, 4], OPTS)) === '[4]', '非整数 id 被过滤（字符串/null/小数）');
assert(JSON.stringify(sanitizeSelection('not-array', OPTS)) === '[]', '非数组输入返回空');
assert(sanitizeSelection([5, 1, 3], OPTS).join(',') === '5,1,3', '顺序保持（首次出现序）');
const over = Array.from({ length: 20 }, (_, i) => i + 1);
assert(sanitizeSelection(over, OPTS).length === MAX_PICK, `超出 ${MAX_PICK} 张截断到上限`);
assert(sanitizeSelection([1, 2], OPTS) !== sanitizeSelection([1, 2], OPTS), '始终返回新数组（不改动入参）');
const origin = [1, 2];
sanitizeSelection(origin, OPTS);
assert(origin.length === 2, '入参数组不被改动');

// 2. toggleSelection：加 / 减 / 上限 / 非法
let res = toggleSelection([1, 2], 3, OPTS);
assert(res.added && !res.removed && res.blocked === null && res.next.join(',') === '1,2,3', '未选中的唱片点击后加入草稿');
res = toggleSelection([1, 2, 3], 2, OPTS);
assert(res.removed && !res.added && res.next.join(',') === '1,3', '已选中的唱片点击后从草稿移除');
res = toggleSelection(over.slice(0, MAX_PICK), 25, OPTS);
assert(res.blocked === 'max' && res.added === false && res.next.length === MAX_PICK, `满 ${MAX_PICK} 张后再加被拦截`);
res = toggleSelection([1], 0, OPTS);
assert(res.blocked === 'invalid' && res.next.join(',') === '1', '非法 id（0）不进入草稿');
res = toggleSelection([1], 26, OPTS);
assert(res.blocked === 'invalid', '越界 id（26）不进入草稿');
res = toggleSelection([1, 1, 2], 2, OPTS);
assert(res.next.join(',') === '1', '含重复 id 的草稿先清洗再切换');

// 3. 与 records.js 数据源集成：readSelection + sanitize = 页面初始草稿
const emptyGet = () => '';
assert(JSON.stringify(sanitizeSelection(readSelection(emptyGet), OPTS)) === JSON.stringify(DEFAULT_SELECTION),
  '无存档时回退默认选择（含 Peaceful）');
const savedGet = () => JSON.parse(JSON.stringify([3, 3, 7, 30, 0]));
assert(JSON.stringify(sanitizeSelection(readSelection(savedGet), OPTS)) === '[3,7]',
  '存档含重复/非法 id 时清洗为合法去重集合');
const dirtyGet = () => 'garbage';
assert(JSON.stringify(sanitizeSelection(readSelection(dirtyGet), OPTS)) === JSON.stringify(DEFAULT_SELECTION),
  '存档损坏时回退默认选择');
const allInvalidGet = () => [26, 27, 0];
assert(JSON.stringify(sanitizeSelection(readSelection(allInvalidGet), OPTS)) === JSON.stringify(DEFAULT_SELECTION),
  '存档全部非法时回退默认选择');

// 4. 默认选择与元数据契约（不得破坏第 25 张真实音频唱片）
assert(RECORDS.length === 25, '唱片库共 25 张');
assert(DEFAULT_SELECTION.length === 7, '默认选择 7 张（7/12）');
assert(DEFAULT_SELECTION.every((id) => id >= 1 && id <= RECORDS.length), '默认选择全部合法');
assert(DEFAULT_SELECTION.includes(25), '默认选择含第 25 张《Peaceful》');
const peaceful = RECORDS[24];
assert(peaceful.title === 'Peaceful' && peaceful.audio === true && peaceful.trackId === 'peaceful',
  '第 25 张真实音频唱片元数据完好（audio + trackId）');
assert(MAX_PICK === 12, '选择上限 12 张');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
