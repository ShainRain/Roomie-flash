/**
 * Roomie 唱片库共享数据 — Web 手动移植版（MANUAL PORT，非 sync-shared 生成）
 *
 * 与 miniprogram/utils/records.js 的差异（有意为之）：合法器乐迁移后，Web 端
 * 24 张收藏唱片全部改为器乐/氛围标题（移除版权曲目元数据）；第 25 张
 * Peaceful 为真实音频唱片（audio:true，点击即播，CC0 1.0 已核验）。
 * API 与数据结构保持一致：readSelection 注入式 getter、非法 id 过滤、空回退默认。
 */

export const RECORD_COLORS = ['#23262B', '#3B4A6B', '#6B3B3B', '#3B6B4F', '#6B5A3B', '#4F3B6B', '#2F5D6B', '#6B3B5A'];
export const RECORD_TITLES = [
  '夜航', '蓝调时刻', '微光', '慢波', '雾窗', '静电',
  '拾光', '星尘', '纸月', '远灯', '低语', '余温',
  '漫游', '青苔', '落霞', '枕雨', '拾荒', '微醺',
  '旧港', '空镜', '独白', '飞鸟', '暖炉', '深巷'
];

export const RECORDS = RECORD_TITLES.map((title, i) => ({
  id: i + 1,
  title,
  color: RECORD_COLORS[i % RECORD_COLORS.length]
}));

// 真实音频唱片：点击即播放（audio 标记驱动播放器；trackId 对应歌单曲目 id）
RECORDS.push({
  id: RECORD_TITLES.length + 1,
  title: 'Peaceful',
  color: RECORD_COLORS[RECORD_TITLES.length % RECORD_COLORS.length],
  audio: true,
  trackId: 'peaceful'
});

// 默认挂墙选择（含真实音频唱片，与小程序语义一致）
export const DEFAULT_SELECTION = [1, 2, 3, 5, 8, 19, RECORDS.length];
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

export default { RECORDS, RECORD_COLORS, RECORD_TITLES, DEFAULT_SELECTION, readSelection, byId, MAX_PICK };
