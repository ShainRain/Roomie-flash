# Postcard 验收报告 — Phase 4D

> 日期：2026-10-07 · 迭代：2 轮（状态合成落地 → 邮戳避让微调）· 基准：`reference-assets/ui-reference/postcard.png`（依据 `visual-validation/postcard-reference-spec.md`）
> 产物：`visual-validation/rendered/postcard.png`、`postcard-state2.png`（改房间后）、`visual-validation/diff/postcard.png`

## 概念落地

「一张从 Roomie 世界里寄出去的实体明信片。」

**最大的结构升级：房间图不再是固定装饰缩略图。** Canvas 内改为**实时分层合成**（与 room-scene 同一图层栈、同一 `room-scene-layout.js` 数据）：

- `pc-base.jpg` + L2 冷夜（色温反向，screen 混合）+ 地板菱形换色（读 `roomie_room.floor`）
- L3 暖光洗（色温主层）+ 唱片槽位（当前 `roomie_records` 选择）
- 选中家具覆盖层（读 `roomie_room.furniture`，z 同轴）+ MOMO/KIKI（Master 站位 + 脚底阴影）
- L7 放映光束（"放映中"明信片）
- 印刷细节全部进入画布（保存图含）：纸粒散点、胶带两角、虚线邮票+黑胶、同心双环邮戳 23:59 ROOMIE POST

画布安全层 `assets/img/pc/`（44 个 JPG/PNG）由 `tools/gen-postcard-layers.js` 生成——规避了规格中"WebP 不进 Canvas"的约束。

## 门禁检查（10 项）

| 检查 | 结果 |
| --- | --- |
| 像"明信片" | 纸+墨+唱片+房间，胶带/邮票/邮戳 ✓ |
| 属于 Roomie 世界 | 房间即 Master ✓ |
| Room Master 复用 | 同资产同灯光同角色同站位 ✓ |
| 当前房间状态正确 | 实测：改 blue-gray/6000K/去沙发吉他 → 明信片同步（state2 对照图） ✓ |
| 房间绝对主体 | 占卡 ~66%，信息让位 ✓ |
| 纸张/印刷材质 | 纸粒+虚线邮票+邮戳 ✓ |
| Typography | 三级（tagline > 页脚 > 邮戳） ✓ |
| 留白 | 明显 ✓ |
| tagline 层级 | 唯一大字文案 ✓ |
| 分享/保存 UI | 页面底部，不压明信片 ✓ |

## 功能验收（运行时实测）

- Canvas 就绪保护：`ready=false` 时保存被 toast 拦截（代码路径保留） ✓
- 保存链路：`canvasToTempFilePath` 成功 → 触发**系统相册权限弹窗**（真机同款流程，截图存档）→ `saving` 在 complete 复位 ✓
- 权限失败 → `wx.openSetting` 弹窗路径保留 ✓
- 分享入口 `onShareAppMessage` 保留 ✓
- 状态恢复（walnut/2700K/13 件） ✓

test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / bindings 全页面 OK / 全量 JS `node --check` 通过。

## P0/P1/P2

- P0：无
- P1：无
- P2：`pc/` 画布安全层增加包体 ~1.9MB（44 个文件）；邮戳与唱片行末端轻微相触（真实邮戳压印效果，有意保留）；KIKI 在默认布局下被沙发遮挡（与 Master 一致）。

## 环境依赖

- 相册实际写入依赖用户在系统弹窗中点「允许」（模拟器弹窗已截证）；真机二次确认。

## 停止条件

未触发（2 轮内收敛）。
