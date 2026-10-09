/**
 * 唱片墙选择纯逻辑 — records 页与 profile 页共用同一套交互规则。
 *
 * 与 state/records.js 的关系：records.js 是唱片元数据/存档读取的唯一数据源
 * （MANUAL PORT，保持与小程序 API  parity，不动它）；本模块只负责「选择草稿」
 * 的运算：清洗（去重/去非法/截断）与点选切换。roomie_records 的存储 schema
 * 不变——始终是数字 id 数组。
 */

/**
 * 清洗任意来源的选择数组：保留合法 id（1..maxId）、按首次出现去重、
 * 超出 maxPick 时截断尾部。始终返回新数组，不改动入参。
 */
export function sanitizeSelection(ids, { maxPick = 12, maxId = 25 } = {}) {
  if (!Array.isArray(ids)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    // 严格契约：roomie_records 是数字 id 数组；字符串/null/小数/NaN 一律视为非法
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1 || raw > maxId || seen.has(raw)) continue;
    if (out.length >= maxPick) break;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

/**
 * 点选切换（纯函数）：
 * - 已在选择中 → 移除（removed）
 * - 未在选择中 → 尝试加入；达到上限返回 blocked:'max'，next 与入参一致
 * - 非法 id → blocked:'invalid'，next 与入参一致
 * 返回 { next, added, removed, blocked }；blocked 为 null 表示切换成功。
 */
export function toggleSelection(ids, id, { maxPick = 12, maxId = 25 } = {}) {
  const current = sanitizeSelection(ids, { maxPick, maxId });
  if (!Number.isInteger(id) || id < 1 || id > maxId) {
    return { next: current, added: false, removed: false, blocked: 'invalid' };
  }
  if (current.includes(id)) {
    return { next: current.filter((x) => x !== id), added: false, removed: true, blocked: null };
  }
  if (current.length >= maxPick) {
    return { next: current, added: false, removed: false, blocked: 'max' };
  }
  return { next: current.concat([id]), added: true, removed: false, blocked: null };
}

export default { sanitizeSelection, toggleSelection };
