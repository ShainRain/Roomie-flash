// 房间地图行为断言 — port of tools/test-room-map.js
// Adapted to the createMap(GEOMETRY, SceneLayout) path only (Room Master Scene
// geometry: X0=414 Y0=235 SX=480 SY=250 depthTop 32–85); the legacy
// room-layout.js default instance does not exist in the web port.
import { createMap } from '../src/shared/room-map.js';
import SceneLayout from '../src/shared/room-scene-layout.js';

const G = SceneLayout.GEOMETRY;
const map = createMap(G, SceneLayout);

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) { passed += 1; console.log(`ok ${passed + failed} - ${name}`); }
  else { failed += 1; console.error(`FAIL - ${name}`); }
}

// uv → stage % 换算（新几何）
function pt(u, v) {
  return { left: (G.X0 + G.SX * (u - v)) / 8.28, top: (G.Y0 + G.SY * (u + v)) / 8.28 };
}

// 1. 出生点均可站立（room: 40/74 + 52/64）
[[40, 74], [52, 64]].forEach(([l, t], i) => {
  assert(`spawn#${i + 1} (${l},${t}) 可站立`, !map.isBlocked({ left: l, top: t }));
});

// 2. 墙面/天空不可走
assert('墙面点 (50,10) 被阻挡', map.isBlocked({ left: 50, top: 10 }));
assert('后墙点 (50,25) 被阻挡', map.isBlocked({ left: 50, top: 25 }));

// 3. clampToFloor 把界外点拉回菱形
const clamped = map.clampToFloor({ left: 10, top: 10 });
assert('clamp 后落在地板菱形内', map.insideFloor(clamped));

// 4. 家具占地被阻挡（沙发中心、唱机柜中心，由 collision 矩形中心换算）
assert('沙发占地被阻挡', map.isBlocked(pt(0.10, 0.45)));
assert('唱机柜占地被阻挡', map.isBlocked(pt(0.69, 0.10)));

// 5. 直线路径：空地直达返回单点
const direct = map.findPath({ left: 40, top: 74 }, { left: 36, top: 76 });
assert('空地直达路径为单点', direct.length === 1 && direct[0].left === 36 && direct[0].top === 76);

// 6. 绕障路径：目标落在茶几上时回退绕行，且每段无碰撞
const start = { left: 40, top: 74 };
const goal = map.resolveTarget(start, pt(0.36, 0.57)); // 茶几中心
const path = map.findPath(start, goal);
assert('绕障路径至少一个中间点', path.length >= 1);
let segOk = true;
let anchor = start;
path.forEach((p) => { if (!map.segmentClear(anchor, p)) segOk = false; anchor = p; });
assert('绕障路径每段均可通行', segOk);
assert('路径终点等于目标点', path[path.length - 1].left === goal.left && path[path.length - 1].top === goal.top);

// 7. resolveTarget：点在家具上时回退到可站立点
const resolved = map.resolveTarget({ left: 40, top: 74 }, pt(0.10, 0.45));
assert('家具落点被解析为可站立点', !map.isBlocked(resolved));

// 8. 景深单调：越靠近前景（top 大）缩放越大，z 序越高
const far = map.depthFor(40);
const near = map.depthFor(84);
assert('景深缩放随纵深增大', near.scale > far.scale && near.z > far.z);

// 9. DIY 家具显隐联动碰撞：撤掉沙发后其占地可行走，固定件（茶几）不受影响
assert('默认沙发占地被阻挡', map.isBlocked(pt(0.10, 0.45)));
map.setActiveFurniture(['rug']);
assert('撤掉沙发后其占地可行走', !map.isBlocked(pt(0.10, 0.45)));
assert('固定件茶几不受家具选择影响', map.isBlocked(pt(0.36, 0.57)));
map.setActiveFurniture(null);
assert('重置后沙发占地恢复阻挡', map.isBlocked(pt(0.10, 0.45)));

// 10. 障碍由 room-scene-layout collision 派生（单一数据源）
const withCollision = SceneLayout.FURNITURE.filter((f) => f.collision);
assert('布局中带 collision 的家具 ≥5 件', withCollision.length >= 5);
withCollision.forEach((f) => {
  const ob = map.OBSTACLES.find((o) => o.furniture === f.key);
  assert(`障碍 ${f.key} 存在于 OBSTACLES 且矩形一致`, !!ob
    && ob.u0 === f.collision.u0 && ob.v0 === f.collision.v0
    && ob.u1 === f.collision.u1 && ob.v1 === f.collision.v1);
});

// 11. 固定件碰撞体（茶几）来自 FIXED_COLLIDERS 且不绑家具
const table = map.OBSTACLES.find((o) => o.id === 'table' && o.furniture === null);
assert('固定件茶几障碍存在且 furniture 为 null', !!table);
assert('FIXED_COLLIDERS 声明了茶几', (SceneLayout.FIXED_COLLIDERS || []).some((c) => c.id === 'table' && !!c.collision));

// 12. 碰撞矩形中心（uv→stage%）必被阻挡：逐家具验证数据驱动生效
withCollision.forEach((f) => {
  const cu = (f.collision.u0 + f.collision.u1) / 2;
  const cv = (f.collision.v0 + f.collision.v1) / 2;
  assert(`家具 ${f.key} 碰撞中心被阻挡`, map.isBlocked(pt(cu, cv)));
});

// 13. 景深区间收敛到 spec 0.82–1.05
assert('景深上限 = 1.05', map.depthFor(85).scale === 1.05 && map.depthFor(100).scale === 1.05);
assert('景深下限 ≥ 0.8', map.depthFor(32).scale >= 0.8 && map.depthFor(0).scale >= 0.8);

// 14. floorPolygon 导出地板菱形四角（scene 组件 floor tint 唯一来源）
const poly = map.floorPolygon();
assert('floorPolygon 返回四角且后角在画布水平中心', poly.length === 4
  && Math.abs(poly[1].left - 50) < 0.01 && Math.abs(poly[1].top - 235 / 8.28) < 0.01);

// 15. createMap 工厂实例独立：显隐互不影响
const master = createMap(G, SceneLayout);
assert('工厂实例墙面点被阻挡', master.isBlocked({ left: 50, top: 10 }));
assert('工厂实例地板前区可站立', !master.isBlocked({ left: 40, top: 74 }));
master.setActiveFurniture([]);
assert('工厂实例家具显隐独立（清空后沙发碰撞中心可过）', !master.isBlocked(pt(0.10, 0.45)));
assert('默认实例不受工厂实例显隐影响', map.isBlocked(pt(0.10, 0.45)));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
