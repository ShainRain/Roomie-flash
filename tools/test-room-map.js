// 房间地图行为断言：边界约束、碰撞、A* 寻路、景深
const map = require('../miniprogram/utils/room-map');

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) { passed += 1; console.log(`ok ${passed + failed} - ${name}`); }
  else { failed += 1; console.error(`FAIL - ${name}`); }
}

// 1. 出生点均可站立（room: 40/74 + 52/64；duo: 40/72 + 52/62）
[[40, 74], [52, 64], [40, 72], [52, 62]].forEach(([l, t], i) => {
  assert(`spawn#${i + 1} (${l},${t}) 可站立`, !map.isBlocked({ left: l, top: t }));
});

// 2. 墙面/天空不可走
assert('墙面点 (50,30) 被阻挡', map.isBlocked({ left: 50, top: 30 }));
assert('天空点 (10,10) 被阻挡', map.isBlocked({ left: 10, top: 10 }));

// 3. clampToFloor 把界外点拉回菱形
const clamped = map.clampToFloor({ left: 10, top: 10 });
assert('clamp 后落在地板菱形内', map.insideFloor(clamped));

// 4. 家具占地被阻挡（沙发中心、唱机柜中心）
assert('沙发占地被阻挡', map.isBlocked({ left: 38, top: 60 }));
assert('唱机柜占地被阻挡', map.isBlocked({ left: 68, top: 63 }));

// 5. 直线路径：空地直达返回单点
const direct = map.findPath({ left: 40, top: 74 }, { left: 44, top: 76 });
assert('空地直达路径为单点', direct.length === 1 && direct[0].left === 44 && direct[0].top === 76);

// 6. 绕障路径：穿过茶几的直线必须绕行，且每段无碰撞
const start = { left: 40, top: 74 };
const goal = map.resolveTarget(start, { left: 54, top: 58 });
const path = map.findPath(start, goal);
assert('绕障路径至少一个中间点', path.length >= 1);
let segOk = true;
let anchor = start;
path.forEach((p) => { if (!map.segmentClear(anchor, p)) segOk = false; anchor = p; });
assert('绕障路径每段均可通行', segOk);
assert('路径终点等于目标点', path[path.length - 1].left === goal.left && path[path.length - 1].top === goal.top);

// 7. resolveTarget：点在家具上时回退到可站立点
const resolved = map.resolveTarget({ left: 40, top: 74 }, { left: 38, top: 60 });
assert('家具落点被解析为可站立点', !map.isBlocked(resolved));

// 8. 景深单调：越靠近前景（top 大）缩放越大，z 序越高
const far = map.depthFor(52);
const near = map.depthFor(84);
assert('景深缩放随纵深增大', near.scale > far.scale && near.z > far.z);

// 9. DIY 家具显隐联动碰撞：撤掉沙发后其占地可行走，固定件（茶几）不受影响
assert('默认沙发占地被阻挡', map.isBlocked({ left: 38, top: 60 }));
map.setActiveFurniture(['rug']);
assert('撤掉沙发后其占地可行走', !map.isBlocked({ left: 38, top: 60 }));
assert('固定件茶几不受家具选择影响', map.isBlocked({ left: 43, top: 66 }));
map.setActiveFurniture(null);
assert('重置后沙发占地恢复阻挡', map.isBlocked({ left: 38, top: 60 }));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
