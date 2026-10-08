/**
 * GENERATED from miniprogram/utils/room-hit.js by scripts/sync-shared.mjs — do not hand-edit.
 * Run `npm run sync:shared` to regenerate; `npm test` fails on drift.
 */
/**
 * 家具互动命中测试（hitArea 管道,与 room-map 的 collision 完全分离）
 *
 * 规则（见 Phase 交互修复规格）：
 * - tap 点先转到舞台百分比坐标（组件 onStageTap 已完成归一化）;
 * - 从最高 z-index 家具开始检查 hitArea;
 * - 命中 → furnituretap;未命中 → floor tap(寻路);
 * - hitArea 只服务互动,绝不进 A*;collision 只服务移动,绝不触发互动。
 */
function containsRect(area, left, top) {
  return left >= area.left && left <= area.left + area.width
    && top >= area.top && top <= area.top + area.height;
}

export function contains(area, left, top) {
  if (!area) return false;
  if (area.type === 'polygon' && Array.isArray(area.points)) {
    // 射线法
    let inside = false;
    const pts = area.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (((yi > top) !== (yj > top))
        && (left < ((xj - xi) * (top - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  return containsRect(area, left, top);
}

/**
 * items: [{ id, z, hitArea }] —— 返回命中的最高 z 项,未命中返回 null
 */
export function hitTest(left, top, items) {
  const sorted = items
    .filter((it) => it.hitArea)
    .slice()
    .sort((a, b) => (b.z || 0) - (a.z || 0));
  for (const it of sorted) {
    if (contains(it.hitArea, left, top)) return it;
  }
  return null;
}
