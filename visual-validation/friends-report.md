# Friends 验收报告 — Phase 4（1/4）

> 日期：2026-10-07 · 迭代：1 轮通过 · 参考：`reference-assets/ui-reference/friends.png`（Room Master 派生）
> 产物：`visual-validation/rendered/friends.png`、`visual-validation/diff/friends.png`

## 概念落地

"夜里，每个朋友都住在自己的小房间里。" 顶部不再是整图村落插画 + 悬浮标签，而是 **3 张 Master 派生的 mini-room vignette**（`tools/gen-friends-vignettes.js`）：同一资产、同一灯光层、同一等距微距视角、同一角色语言，逐好友变体（色相/明度微调 + 角色换色），不重画家具。

## 分项

| 项 | 结果 |
| --- | --- |
| Visual Anchor | 好友房间 vignette 横排（可横向滑动），房间空间是第一视觉 ✓ |
| Layout | 刊头 → vignette 横排 → 在线卡 → 离线卡 → 邀请 CTA；vignette 区约占首屏 30% ✓ |
| Typography | 全部走令牌（fs/paper-title/en-serif） ✓ |
| Color | 深夜壳 + 米白卡 + 绿色仅用于在线点/来坐坐/CTA ✓ |
| Material | vignette 与 Master 同材质（同文件管线） ✓ |
| Asset quality | 768×600 webp ×5（含 RITA/TAO 离线降亮变体备用） ✓ |

## 与 reference 的主要差异

1. vignette 卡片为横滑（3 张屏内容纳 ~2.2 张），reference 为 3 张静态等宽——横滑更贴合真实屏宽，接受。
2. KIKI vignette 动作按钮为「进入」（她在你的房间），reference 卡上误写「来坐坐」——以产品逻辑为准，reference 文案不单独修。
3. CTA 在首屏下缘之外（列表更长），需轻微上滑；reference 为一屏收纳。不阻塞。

## 功能回归

- 邀请链路实测：NANA 邀请 → `inviting` 置位 → 重复点击被拒 → 1.5s 后接受弹窗 ✓
- KIKI「进入」→ `/pages/duo/duo` ✓
- Tab 选中态、toast、roomie_unread 未触碰 ✓
- test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / check-bindings 全页面 OK

## P0/P1/P2

- P0：无
- P1：无
- P2：roomie-header 的 LIVE pill 在模拟器右上角与胶囊略挤（全局组件行为，所有页一致，列入 Phase 5 UI 收尾统一处理）；CTA 位置偏下。

## 停止条件

未触发（1 轮通过）。
