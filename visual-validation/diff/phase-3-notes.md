# Phase 3 视觉对照记录 — Room / Duo / Architect 统一

> 日期：2026-10-07 · 结论：三页全部切换 `<room-scene>`，重复场景实现已删除，无 P0。

## 产物

- rendered: `room.png` / `duo.png` / `architect.png`（微信开发者工具真实截图）
- reference: `ui-reference/duo.png` / `ui-reference/architect.png`（从 Room Master 派生，非旧 baseline）
- diff: `diff/room.png`（vs 离线 Master）/ `diff/duo.png` / `diff/architect.png`

## 架构收敛事实

- 场景渲染唯一来源：`components/room-scene/`（home / room / duo / architect 四页消费）。
- 空间数据唯一来源：`utils/room-scene-layout.js`（几何/家具/槽位/碰撞/缩略图路径，`gen-room-master.js` 生成）。
- 碰撞/寻路：`room-map.js createMap(GEOMETRY, SceneLayout)`，duo 与 room 各自实例、同一数据。
- Duo 恢复：floor / lightTemp / 家具覆盖层 / 角色渲染 / 遮挡 / 热点（落地灯与放映机可开关，其余给轻量气泡）。
- Architect：108% 宽错位已修（正方形 preview-frame）；家具网格改用 `furn-thumb-*` 真实缩略图（从覆盖层 bounds 裁切）；删除 CSS 渐变 tint（色温由灯光层 opacity 驱动，拖动实时预览）。
- `furn-icon-*` 双色 icon 已无任何页面引用。

## 逐项检查（用户门禁）

| 检查 | 结果 |
| --- | --- |
| 房间比例 | room 100vw 满屏 / duo 106vw / architect 正方形预览，几何同源 ✓ |
| 角色比例 | 三页均为舞台相对 % + depthFor，同一坐标空间 ✓ |
| 家具位置 | 同一 room-scene-layout，三页一致 ✓ |
| lighting | L0–L7 灯光层三页共享，duo 恢复灯光（此前缺失） ✓ |
| floor | duo 恢复地板换色（此前缺失），architect 实时预览 ✓ |
| occlusion | 角色 z=top×10 与家具同轴，三页一致 ✓ |
| character shadow | 组件内脚底阴影（精确脚底锚定） ✓ |
| stage geometry | 全部正方形舞台；architect 108% 错位消除 ✓ |
| architect preview vs room | 同一组件同一数据，保存后 room 立即反映（实测：移除吉他→保存→room 消失→恢复） ✓ |

## 功能回归

- test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / check-bindings 全页面 OK / 全量 JS `node --check` 通过
- 路径实测：Home→Room ✓ / Room→Duo ✓ / Duo→退出回 Room ✓ / Architect→保存→Room ✓

## 已知差异（非 P0）

- Duo 的 `sync` 数值仍是 95–99 演示值（既有行为，本阶段不动）。
- Duo 家具热点为轻量气泡 + 灯/放映机开关，不携带 room 页的完整状态机（roomState/seated/唱片播放状态仍为 room 页职责）——业务边界有意为之。
- `utils/room-layout.js` 与旧资产（room-interactive.webp 等）保留在仓库供 preview-app 复刻页使用，小程序页面已零引用；清理列入后续阶段。
- 真实触摸链路（E1）同 Phase 1.5 记录，建议人工复核 duo 点按移动与热点各一次。
