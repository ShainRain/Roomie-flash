/**
 * 房间共享地图（百分比坐标系，与 room-interactive.webp 底图对齐）
 * room 页与 duo 页共用，避免两处拷贝漂移。
 *
 * 可行走区域 = 底图地板菱形（uv 参数化，见下）内缩边界；
 * 角色位置始终被约束在菱形内，不会走上墙面或天空。
 */

// 底图 828×828：地板菱形四角 (140,558) (414,414) (688,558) (414,710)
const X0 = 414;
const Y0 = 414;
const SX = 274;
const SY = 144;
const PX = 8.28; // 画布 px / 百分比
const UV_MIN = 0.06;
const UV_MAX = 0.94;
const RADIUS = 2.4; // 角色碰撞半径（%，碰撞点为脚底）

// 家具占地（屏幕百分比轴对齐矩形，与底图脚印对齐；地面唱片/地毯可跨越）
// furniture: 对应建筑师模式家具 key；为 null 表示固定件（茶几），始终生效
const OBSTACLES = [
  { id: 'sofa', furniture: 'sofa', left: 30.1, top: 55.2, right: 46, bottom: 63.9 },
  { id: 'table', furniture: null, left: 38.1, top: 63.6, right: 48, bottom: 68.4 },
  { id: 'credenza', furniture: 'vinyl-player', left: 57.9, top: 57.7, right: 81.1, bottom: 69.8 },
  { id: 'guitar-corner', furniture: 'guitar', left: 48.7, top: 76.4, right: 58, bottom: 82 },
  { id: 'plant', furniture: 'plant', left: 23.9, top: 63.9, right: 29.9, bottom: 67 },
  { id: 'lamp', furniture: 'lamp', left: 65.8, top: 70.5, right: 70, bottom: 72.7 }
];

// DIY 家具显隐联动：未选择的家具撤掉碰撞。null = 全部生效（未初始化时的安全默认）
let activeFurniture = null;

function setActiveFurniture(keys) {
  activeFurniture = Array.isArray(keys) ? new Set(keys) : null;
}

function obstacleActive(ob) {
  return !ob.furniture || !activeFurniture || activeFurniture.has(ob.furniture);
}

function toUV(left, top) {
  const a = (left * PX - X0) / SX;
  const b = (top * PX - Y0) / SY;
  return { u: (a + b) / 2, v: (b - a) / 2 };
}

function fromUV(u, v) {
  return { left: (X0 + SX * (u - v)) / PX, top: (Y0 + SY * (u + v)) / PX };
}

function insideFloor(point) {
  const { u, v } = toUV(point.left, point.top);
  const EPS = 1e-9;
  return u >= UV_MIN - EPS && u <= UV_MAX + EPS && v >= UV_MIN - EPS && v <= UV_MAX + EPS;
}

// 越界点拉回地板菱形（保持行进方向的最近可行点）
function clampToFloor(point) {
  const { u, v } = toUV(point.left, point.top);
  return fromUV(
    Math.max(UV_MIN, Math.min(UV_MAX, u)),
    Math.max(UV_MIN, Math.min(UV_MAX, v))
  );
}

function hitsObstacle(point) {
  return OBSTACLES.some((ob) => obstacleActive(ob)
    && point.left > ob.left - RADIUS && point.left < ob.right + RADIUS
    && point.top > ob.top - RADIUS && point.top < ob.bottom + RADIUS);
}

function isBlocked(point) {
  return !insideFloor(point) || hitsObstacle(point);
}

function distance(a, b) {
  return Math.sqrt(Math.pow(b.left - a.left, 2) + Math.pow(b.top - a.top, 2));
}

function segmentClear(start, end) {
  const length = distance(start, end);
  const samples = Math.max(2, Math.ceil(length / 1.2));
  for (let i = 1; i < samples; i += 1) {
    const r = i / samples;
    if (isBlocked({ left: start.left + (end.left - start.left) * r, top: start.top + (end.top - start.top) * r })) return false;
  }
  return true;
}

// ---- 网格 A* 寻路（uv 空间 17×17，8 方向）----
const GRID_STEP = (UV_MAX - UV_MIN) / 16;

function gridFree(cu, cv) {
  return !isBlocked(fromUV(cu, cv));
}

function nearestFreeCell(point) {
  const { u, v } = toUV(point.left, point.top);
  let best = null;
  for (let i = 0; i <= 16; i += 1) {
    for (let j = 0; j <= 16; j += 1) {
      const cu = UV_MIN + i * GRID_STEP;
      const cv = UV_MIN + j * GRID_STEP;
      if (!gridFree(cu, cv)) continue;
      const d = Math.pow(cu - u, 2) + Math.pow(cv - v, 2);
      if (!best || d < best.d) best = { i, j, d };
    }
  }
  return best;
}

function astar(start, target) {
  const s = nearestFreeCell(start);
  const g = nearestFreeCell(target);
  if (!s || !g) return null;
  const key = (i, j) => `${i},${j}`;
  const open = [{ i: s.i, j: s.j, f: 0, g: 0, parent: null }];
  const cost = new Map([[key(s.i, s.j), 0]]);
  const closed = new Set();
  const h = (i, j) => {
    const di = Math.abs(i - g.i);
    const dj = Math.abs(j - g.j);
    return Math.max(di, dj) + 0.414 * Math.min(di, dj);
  };
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const ck = key(cur.i, cur.j);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.i === g.i && cur.j === g.j) {
      const cells = [];
      let node = cur;
      while (node) { cells.unshift(node); node = node.parent; }
      return cells.map((c) => fromUV(UV_MIN + c.i * GRID_STEP, UV_MIN + c.j * GRID_STEP));
    }
    for (let di = -1; di <= 1; di += 1) {
      for (let dj = -1; dj <= 1; dj += 1) {
        if (!di && !dj) continue;
        const ni = cur.i + di;
        const nj = cur.j + dj;
        if (ni < 0 || ni > 16 || nj < 0 || nj > 16) continue;
        const cu = UV_MIN + ni * GRID_STEP;
        const cv = UV_MIN + nj * GRID_STEP;
        if (!gridFree(cu, cv)) continue;
        // 对角移动要求两侧正交格也可走，避免穿墙角
        if (di && dj && (!gridFree(UV_MIN + cur.i * GRID_STEP, cv) || !gridFree(cu, UV_MIN + cur.j * GRID_STEP))) continue;
        const nk = key(ni, nj);
        if (closed.has(nk)) continue;
        const ng = cur.g + (di && dj ? 1.414 : 1);
        if (cost.has(nk) && cost.get(nk) <= ng) continue;
        cost.set(nk, ng);
        open.push({ i: ni, j: nj, g: ng, f: ng + h(ni, nj), parent: cur });
      }
    }
  }
  return null;
}

// 视线拉直：去掉可直达的中间点
function smoothPath(start, waypoints) {
  const out = [];
  let anchor = start;
  let i = 0;
  while (i < waypoints.length) {
    let far = i;
    for (let j = waypoints.length - 1; j > i; j -= 1) {
      if (segmentClear(anchor, waypoints[j])) { far = j; break; }
    }
    out.push(waypoints[far]);
    anchor = waypoints[far];
    i = far + 1;
  }
  return out;
}

// 返回从 start 到 target 的路径点（不含 start，含 target）；target 需先经 resolveTarget
function findPath(start, target) {
  if (!isBlocked(target) && segmentClear(start, target)) return [target];
  const raw = astar(start, target);
  if (!raw || !raw.length) return [target];
  const cells = raw.concat([target]);
  return smoothPath(start, cells);
}

// 点击落点修正：先拉回地板，落在家具上则沿视线回退到最近可站立点
function resolveTarget(start, rawTarget) {
  const target = clampToFloor(rawTarget);
  if (!isBlocked(target)) return target;
  for (let ratio = 0.95; ratio >= 0; ratio -= 0.05) {
    const candidate = {
      left: start.left + (target.left - start.left) * ratio,
      top: start.top + (target.top - start.top) * ratio
    };
    if (!isBlocked(candidate)) return candidate;
  }
  return start;
}

// 景深：按纵深（top%）缩放角色并给出遮挡 z 序（家具 z 见页面 furnitureObjects）
function depthFor(top) {
  const t = Math.max(0, Math.min(1, (top - 50) / 35.75));
  return { scale: Number((0.82 + t * 0.26).toFixed(3)), z: Math.round(top * 10) };
}

module.exports = {
  OBSTACLES,
  setActiveFurniture,
  insideFloor,
  clampToFloor,
  isBlocked,
  segmentClear,
  findPath,
  resolveTarget,
  depthFor,
  distance
};
