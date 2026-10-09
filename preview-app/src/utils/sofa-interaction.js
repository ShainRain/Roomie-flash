/**
 * sofa-interaction — 房间页与双人页共用的沙发入座/起身控制（单一实现，禁止两处漂移）
 *
 * 几何（唯一数据源 = SceneLayout 沙发 collision）：
 *   seatPoint（坐垫点）= 沙发碰撞矩形 uv 中心 → fromUV；
 *   视觉校准：furn-sofa.webp 实测坐垫前沿线在 y≈42.5%（352px/828），座位中心 x≈29.6%
 *   → seatPoint 偏移到坐垫前缘（脚底贴前沿，小腿没入前挡板）；
 *   approachPoint = map.resolveTarget(player, seatPoint)（可走点，座位点在碰撞内不可走）。
 *
 * 流程：点沙发 → 记录 preSeatPos →（远则走到 approachPoint，动画结束回调）→
 *   坐标精确 snap 到 seatPoint → sit 帧 + seated=true + 家具 active + 场景刷新。
 * 再点 → 起身：清 seated/overlay/zBoost → 走回 preSeatPos → idle → 清空。
 *
 * 页面注入 ctx：
 *   getPlayer() / setPlayer(pos)           本地角色坐标（left/top/stage%）
 *   getSeated() / setSeated(bool)          坐姿状态（含家具 active 联动由页面负责）
 *   setSprite(frame) / syncCharacters()    精灵帧 + 场景刷新（zBoost/overlay 由页面 syncCharacters 注入）
 *   moveAlongPath(start, target, onComplete) / clearMoveTimer()
 *   flashAction(text) / sendMove(pos)
 */
import SceneLayout from '../shared/room-scene-layout.js';

// 坐垫校准（furn-sofa.webp 实测：坐垫前沿 y≈352/828≈42.5%）：
// seatPoint = 碰撞矩形 uv 中心（fromUV → stage% (29.7, 45.0)）——不额外偏移：
// 偏移上移会让角色 z（top×10+80=505）低于沙发本体 z=519，被整张沙发盖住。
// 脚底 45% 落在前沿挡板上缘，小腿没入挡板（overlay y≥352px 覆盖），躯干在靠背前。
const SEAT_OFFSET = { dx: 0, dy: 0 };

export function sofaSeatPoint(map) {
  const c = SceneLayout.FURNITURE.find((f) => f.id === 'sofa').collision;
  const center = map.fromUV((c.u0 + c.u1) / 2, (c.v0 + c.v1) / 2);
  return { left: center.left + SEAT_OFFSET.dx, top: center.top + SEAT_OFFSET.dy };
}

export function sofaApproachPoint(map, playerPos) {
  return map.resolveTarget(playerPos, sofaSeatPoint(map));
}

export function createSofaActions(ctx) {
  let preSeatPos = null;
  let approachPos = null; // 沙发前可站立点（起身先"下沙发"到这里；座位在碰撞区内，行走校验会挡住）

  function sitDown() {
    // 阻断行走覆写坐姿（旧 animatePlayer 回调不再生效）
    ctx.clearMoveTimer();
    if (!preSeatPos) preSeatPos = { ...ctx.getPlayer() };
    // 坐标精确 snap 到坐垫点（不论距离，杜绝"坐空气"）
    const seat = sofaSeatPoint(ctx.map);
    ctx.setPlayer({ ...ctx.getPlayer(), left: seat.left, top: seat.top });
    ctx.setSeated(true);
    ctx.setSprite('sit');
    ctx.syncCharacters();
    ctx.flashAction('你坐进了沙发 · 继续播放');
  }

  function standUp() {
    ctx.clearMoveTimer();
    ctx.setSeated(false);
    const back = preSeatPos;
    preSeatPos = null;
    ctx.flashAction('你从沙发上站了起来');
    // 先下沙发：座位在沙发碰撞区内（从座位直接行走会被 isBlocked 挡住，
    // 且起身摘掉 zBoost 后角色 z 低于沙发本体会被整张沙发遮住）——snap 到沙发前可站立点
    const exit = approachPos || sofaApproachPoint(ctx.map, ctx.getPlayer());
    approachPos = null;
    ctx.setPlayer({ ...ctx.getPlayer(), left: exit.left, top: exit.top });
    ctx.setSprite('idle');
    ctx.syncCharacters();
    if (back) {
      ctx.moveAlongPath(ctx.getPlayer(), back);
    }
    ctx.sendMove({ ...ctx.getPlayer(), direction: ctx.getPlayer().direction || 'right', walking: false });
  }

  function onSofaTap() {
    if (ctx.getSeated()) {
      standUp();
      return;
    }
    // 点按时记录真实位置（起身恢复用；第二次点不会再覆盖）
    preSeatPos = { ...ctx.getPlayer() };
    approachPos = sofaApproachPoint(ctx.map, ctx.getPlayer());
    if (ctx.map.distance(ctx.getPlayer(), approachPos) > 2) {
      ctx.moveAlongPath(ctx.getPlayer(), approachPos, sitDown);
      return;
    }
    sitDown();
  }

  return {
    onSofaTap,
    sitDown,
    standUp,
    getPreSeatPos: () => preSeatPos,
    // 页面卸载/打断时复位（不留悬挂状态）
    reset() {
      preSeatPos = null;
      approachPos = null;
    }
  };
}

export default { sofaSeatPoint, sofaApproachPoint, createSofaActions };
