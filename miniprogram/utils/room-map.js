/**
 * 房间共享地图（百分比坐标系，与底图对齐）
 * room 页与 duo 页共用，避免两处拷贝漂移。
 *
 * 可行走区域 = 底图地板菱形（uv 参数化，见下）内缩边界；
 * 角色位置始终被约束在菱形内，不会走上墙面或天空。
 *
 * Phase 1 起：
 * - 障碍不再手写，由 utils/room-layout.js 的 FURNITURE[].collision +
 *   FIXED_COLLIDERS 构建（uv 参数化矩形，单一数据源，杜绝双源漂移）；
 * - createMap(geometry) 工厂允许另一套几何（Room Master Scene）复用同一套
 *   寻路/碰撞逻辑；模块默认导出保持旧几何（828 底图, SX=274/SY=144），
 *   duo/architect 行为不变。
 */

const Layout = require('./room-layout');

const PX = 8.28; // 画布 px / 百分比
const UV_MIN = 0.06;
const UV_MAX = 0.94;
const RADIUS_UV = 0.06; // 角色碰撞半径（uv 单位，≈旧制 2.4% 屏幕半径）

// 旧底图 828×828：地板菱形四角 (140,558) (414,414) (688,558) (414,710)
const DEFAULT_GEOMETRY = {
  X0: 414,
  Y0: 414,
  SX: 274,
  SY: 144,
  depthTopMin: 50,
  depthTopMax: 85.75
};

// 碰撞体（uv 矩形）由布局数据派生；id 沿用旧障碍 id，furniture 为 DIY 家具 key
// （null = 固定件，始终生效）
const OBSTACLES = Layout.FURNITURE
  .filter((f) => f.collision)
  .map((f) => ({ id: f.obstacle || f.key, furniture: f.key, ...f.collision }))
  .concat((Layout.FIXED_COLLIDERS || []).map((c) => ({ id: c.id, furniture: c.furniture || null, ...c.collision })));

function createMap(geometry) {
  const G = { ...DEFAULT_GEOMETRY, ...(geometry || {}) };

  // DIY 家具显隐联动：未选择的家具撤掉碰撞。null = 全部生效（未初始化时的安全默认）
  let activeFurniture = null;

  function setActiveFurniture(keys) {
    activeFurniture = Array.isArray(keys) ? new Set(keys) : null;
  }

  function obstacleActive(ob) {
    return !ob.furniture || !activeFurniture || activeFurniture.has(ob.furniture);
  }

  function toUV(left, top) {
    const a = (left * PX - G.X0) / G.SX;
    const b = (top * PX - G.Y0) / G.SY;
    return { u: (a + b) / 2, v: (b - a) / 2 };
  }

  function fromUV(u, v) {
    return { left: (G.X0 + G.SX * (u - v)) / PX, top: (G.Y0 + G.SY * (u + v)) / PX };
  }

  // 地板菱形四角（stage %）：左/后/右/前，供 scene 组件 floor tint clip-path 使用
  function floorPolygon() {
    return [fromUV(0, 1), fromUV(0, 0), fromUV(1, 0), fromUV(1, 1)];
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
    const { u, v } = toUV(point.left, point.top);
    return OBSTACLES.some((ob) => obstacleActive(ob)
      && u > ob.u0 - RADIUS_UV && u < ob.u1 + RADIUS_UV
      && v > ob.v0 - RADIUS_UV && v < ob.v1 + RADIUS_UV);
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

  // 景深：按纵深（top%）缩放角色并给出遮挡 z 序（上限 1.05，spec §4 区间 0.8–1.05）
  function depthFor(top) {
    const t = Math.max(0, Math.min(1, (top - G.depthTopMin) / (G.depthTopMax - G.depthTopMin)));
    return { scale: Number((0.82 + t * 0.23).toFixed(3)), z: Math.round(top * 10) };
  }

  return {
    geometry: G,
    OBSTACLES,
    setActiveFurniture,
    floorPolygon,
    insideFloor,
    clampToFloor,
    isBlocked,
    segmentClear,
    findPath,
    resolveTarget,
    depthFor,
    distance
  };
}

// 默认实例：旧几何（828 底图），对外 API 与 Phase 0 之前完全一致
module.exports = { createMap, ...createMap(DEFAULT_GEOMETRY) };
