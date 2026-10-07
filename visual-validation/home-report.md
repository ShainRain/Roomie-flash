# Home 验收报告 — Phase 2

> 日期：2026-10-07 · 迭代：4 轮（角色消失/过小 → 舞台相对尺寸 → 帧容器宽度 → 脚底锚定+KIKI 走位+pill 对比度）
> 产物：`visual-validation/rendered/home.png`、`visual-validation/diff/home.png`（reference vs rendered）、`reference-assets/ui-reference/home.png`（基准，由 Room Master 派生合成）
> 环境：微信开发者工具模拟器 390×844pt，基础库 3.4.0

## 核心结论

Home = Room Master Scene（`<room-scene>` 组件，与 room 页同一实例）+ Roomie UI Overlay。**没有为 Home 复制任何场景资产或逻辑**——geometry/furniture/materials/lighting/character/z-index/camera 全部来自 `room-scene-layout.js` 单一数据源。无 CSS filter 伪造、无整图截图。

## 量化指标

| 指标 | 实测 | 门槛 | 结果 |
| --- | --- | --- | --- |
| Hero 房间占屏高 | **52.0%**（439pt / 844pt，元素实测） | 48–56% | PASS |
| 舞台 | 58vh 正方形居中裁切进 52vh 容器，等距微距保持 | — | PASS |
| Header 高度 | masthead 两行（品牌+房间名，~104rpx 内容区）+ 安全区 | 不抢戏 | PASS |
| 角色比例 | MOMO 为舞台 ~12.1%（=Master 的 16.9% 房间可视高），纵深缩放正确 | 与 Master 一致 | PASS |
| 唱片/家具/灯光 | 与 room 页同源（floor/lightTemp/furniture/records 读同一存储） | 同源 | PASS |
| Player 高度 | mini-player 卡片 104rpx（复用组件，未改） | — | PASS |
| CTA 高度 | 100rpx 绿色胶囊（令牌 `btn-primary`） | — | PASS |

## 与 reference 的主要视觉差异（diff/home.png）

1. Hero 裁切位置：rendered 用 58vh 舞台居中裁切，房间在画面中略大于 reference（更接近"房间即主角"，接受）。
2. rendered 的 Header 多了 roomie-header 自带的 LIVE pill（组件既有行为，保留）。
3. 唱片槽位 6 张（存储真实选择）vs reference 12 张（Master 满配）——数据差异非视觉缺陷。
4. KIKI 位置：从沙发后（运行时几乎全遮挡）改为沙发左前空地（uv 0.30,0.72）——见下方问题记录 P1-1。

## 问题清单

### P0（无）

无阻塞项。视觉优先级成立：房间 > 角色 > 放映墙/唱片墙 > 状态 > 任务 > Player > CTA > Tab。

### P1

- P1-1 **运行时角色比离线合成多 ~4% 下移的历史成因**：旧锚定 `translate(-50%,-88%)` 依赖元素总高（含阴影/名牌），已重构为 `translate(-50%,-100%)` 脚底精确锚定（组件级修复，room/duo 未来同享）。KIKI 原沙发后站位在运行时下几乎全遮挡，已移至 (25.6, 59.2)。Master 离线渲染的 KIKI 探头构图保留在 room-master.png，无碍。
- P1-2 首页 `nowPlaying` 联动：播放时房间内搭唱盘旋转+墙上徽章（复用组件能力）；当前 Player 默认暂停态所以截图未见，逻辑已接（`Player.subscribe`，onHide 退订）。

### P2

- hero 底部与夜色衔接依赖 Master 底图自带的夜景带，无额外渐隐（reference 有渐隐，观感差异小）。
- 左上角 pill 与唱片墙第一层板的文字局部邻近，亮度已可接受。

## 迭代记录（4 轮，均在预算内）

| 轮 | 问题 | 层级 | 修法 |
| --- | --- | --- | --- |
| 1 | 角色在 Hero 中 ~20% 过小（组件写死 vw，room 页外舞台非 100vw） | Architecture（组件） | 角色尺寸改为舞台相对 % |
| 2 | 角色整体消失（帧容器无宽度，widthFix 塌成 0） | Architecture（组件） | `sc-frame-*` 显式 width:100% |
| 3 | KIKI 几乎全被沙发遮挡（旧锚定把角色多压低 ~4%） | Architecture（组件） | 脚底精确锚定 translate(-50%,-100%)；KIKI 移至沙发左前 |
| 4 | 左上 LIVE pill 在亮墙前对比度不足 | UI | pill 局部加深底色 |

## 功能回归

test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / check-bindings 全页面 OK / 全部 JS `node --check` 通过。
Home 原有行为保留：分享（onShareAppMessage + room-postcard.jpg）、进入房间路由、任务卡/CTA tap、Tab 选中态。

## 环境依赖

- Hero 点按进房间（stagetap → navigateTo）：同 Phase 1.5 的 E1，automator 合成事件无 detail；页面处理链已在 room 页验证，建议人工点按复核一次。
