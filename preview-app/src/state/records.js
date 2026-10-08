/**
 * Roomie 唱片库共享数据
 * ESM port of miniprogram/utils/records.js — logic unchanged.
 * readSelection takes an injected storage getter (pass adapters/storage.getStorageSync).
 */

export const RECORD_COLORS = ['#23262B', '#3B4A6B', '#6B3B3B', '#3B6B4F', '#6B5A3B', '#4F3B6B', '#2F5D6B', '#6B3B5A'];
export const RECORD_TITLES = [
  '晴天', '花海', '夜曲', '稻香', '半岛铁盒', '简单爱',
  '星晴', '安静', '搁浅', '彩虹', '退后', '心雨',
  '屋顶', '枫', '珊瑚海', '轨迹', '借口', '园游会',
  '七里香', '东风破', '发如雪', '千里之外', '菊花台', '青花瓷'
];

export const RECORDS = RECORD_TITLES.map((title, i) => ({
  id: i + 1,
  title,
  color: RECORD_COLORS[i % RECORD_COLORS.length]
}));

export const DEFAULT_SELECTION = [1, 2, 3, 5, 8, 19];
export const MAX_PICK = 12;

// 读取本地唱片墙选择，过滤失效 id；无存档时回退默认选择
export function readSelection(storageGet) {
  const saved = storageGet('roomie_records');
  const valid = Array.isArray(saved) ? saved.filter((id) => id >= 1 && id <= RECORDS.length) : [];
  return valid.length ? valid : DEFAULT_SELECTION.slice();
}

export function byId(id) {
  return RECORDS.find((r) => r.id === id) || null;
}

export default { RECORDS, RECORD_COLORS, DEFAULT_SELECTION, readSelection, byId, MAX_PICK };
