# ROOMIE Phase 0 计划 — 视觉重构工程基础

> 状态：Phase 0 工程基础已落地，等待确认后进入 Phase 1（Room Master Scene）。
> 原则：本阶段**不制作任何新视觉资产**，只建立冻结、目录、指标、接口与架构决策。
> 前置文档：`docs/design/ROOMIE-VISUAL-GAP-ANALYSIS.md`（审计结论）。

---

## 0. Phase 0 已完成事项

| 事项 | 结果 | 证据 |
| --- | --- | --- |
| 冻结可回滚 | 仓库此前无 git。已 `git init`，全量提交基线并打 tag | commit `8fd02fa`，tag **`visual-reset-baseline-2026-10-05`**；回滚命令：`git reset --hard visual-reset-baseline-2026-10-05` |
| 基线测试状态 | 全部通过并记录 | test-player 25✓ / test-sync 10✓ / test-room-map 19✓ / check-bindings 全页面 OK / 全量 JS `node --check` 通过 |
| 基线截图归档 | 8 张当前实现截图已冻结 | `visual-validation/baseline/{home,room,song,duo,friends,architect,profile,postcard}.png`（只读，永不覆盖） |
| 基准目录 | 已建立 + 规则 README | `reference-assets/ui-reference/`（7 张基准图待 Phase 1 后派生，见 §4.4） |
| 验收目录 | 已建立 + 流程 README | `visual-validation/{baseline,reference,rendered,diff}/` |

---

## 1. 回滚策略

- **代码与资产回滚**：`git reset --hard visual-reset-baseline-2026-10-05`。
- **增量工作保护**：Phase 1 起每个 Phase 结束打一个 tag（`phase-1-room-master`、`phase-3-home`…），任何一轮视觉迭代失败可回到上一个 Phase，不必回到零点。
- **资产再生成保证**：`miniprogram/assets/img/` 全部产物可由 `tools/gen-*.js` 重新生成，生成器与产物同库提交，diff 可审查。
- **不可回滚项**：无。本阶段未触碰任何线上/云端资源（项目为本地 mock，无后端）。

---

## 2. 验收目录结构（已建立）

```text
reference-assets/
├── room-inspiration/        # 已有：6 张设计评审参考（不进运行时包）
└── ui-reference/            # 新建：7 页视觉验收基准 + README 规则

visual-validation/
├── README.md                # diff 循环流程与记录格式
├── baseline/                # 冻结前截图（只读）
├── reference/               # 当前生效基准
├── rendered/                # 每轮修改后的渲染
└── diff/                    # 对比产物 + 差异记录（diff/<page>-<date>-<n>.md）
```

渲染来源沿用现有管线：`preview-app/*.html`（Chrome headless，780×1688）；真机截图（`preview-app/shots-real/`）继续标注"依赖环境"，不与 rendered 混放。

---

## 3. 现有资产处置清单（保留 / 重绘 / 替换 / 废弃）

### 3.1 保留（不动）

| 资产 | 理由 |
| --- | --- |
| `tools/gen-room-scene.js` 生成管线（SVG→sharp、坐标系与 room-map 对齐） | 核心存量优势；Master Scene 在其上演进 |
| `miniprogram/utils/room-map.js`、`player.js`、`room-sync.js`、`records.js` | 功能层，RESET-SPEC §30 明确保留 |
| `char-{momo,kiki}-{idle,walk-a,walk-b,sit}.webp` 的**文件接口**（144×184、四姿态、命名） | 页面逻辑不绑绘制来源，换内容不换接口 |
| `app.wxss` 令牌体系与纸张卡/pill/按钮全局类 | 已达目标约 80% |
| `components/roomie-header/`、`components/mini-player/`、`custom-tab-bar/` | 复用良好 |
| `preview-app/` HTML 复刻 + 截图管线 | 作为 rendered 来源接入 visual-validation |
| `reference-assets/room-inspiration/` | 设计评审用，保留 |

### 3.2 重绘（保留机制/接口，重做内容）

| 资产 | 重绘方向 |
| --- | --- |
| `room-interactive.webp` 底图 | 拆分为墙/地/固定装饰 + **独立灯光图层**（见 §6）；去除烘焙暖光，改为中性材质基底 |
| 13 个 `furn-*.webp` 覆盖层 | 材质升级（木纹方向、织物、金属、玻璃）；保持全幅同坐标系覆盖层方案（见 §5.3 决策） |
| 24 个 `rec-*.webp` 封面 | 收藏级原创抽象封面，封套—黑胶节奏，色彩分组 |
| 8 个 `char-*.webp` 角色精灵 | 与房间同光源方向、同材质语言；保持 144×184 四姿态接口 |
| `room-hero.webp` / `room-postcard.jpg` | Master 定稿后重新 composite 派生 |
| `friends-village.webp` | 改为 Master 派生 Variant A/B/C（换唱片墙/地板/沙发/海报配色） |

### 3.3 替换（换新资产，旧的退役）

| 资产 | 替换为 |
| --- | --- |
| `furn-icon-*.webp` ×13（墨黑+亮绿双色 icon） | 从家具资产同源渲染的 96×96 真实缩略图 `furn-thumb-*.webp`（architect 网格用） |

### 3.4 废弃（清除或归档）

| 对象 | 处置 | 理由 |
| --- | --- | --- |
| `tools/prepare-character-assets.js` | **删除** | 引用小红书第三方图片抠图（版权风险），硬编码本机路径，已被 gen-characters.js 取代 |
| `tools/compress-assets.js` | **删除** | 旧 AI 插画管线，输出（room-float 等）已不存在 |
| `figma-assets/hero-art*.png`（~20MB） | 移至 `figma-assets/_archive/` | 无任何现行脚本消费 |
| 根目录 20 个 `gen_*.py` | 移至 `figma-assets/_archive/py/` | 本机无 Python 时代的遗产，产物在 figma-assets/preview |
| `preview-app/shots$p.png` | 删除 | 误命名副本 |

> 删除/归档在 Phase 1 开工前随第一个工作提交执行，基线 tag 已保证可找回。

---

## 4. Room Master 可量化视觉验收指标

Master Scene 过 QA 的门槛。**全部可测量或可判定**，不接受"感觉像了"。

### 4.1 构图与镜头（Geometry）

| 指标 | 门槛 | 测量方式 |
| --- | --- | --- |
| 房间可视主体占 stage 画幅 | 地板菱形 + 墙体合占 stage 面积 ≥ 75%（当前 ~50%，四周大量空深蓝） | 截图像素分析（sharp 采样） |
| 等距微距视角 | 角色精灵高度 ÷ 房间可视高度（墙顶到地板前沿）= 15%–22%（当前 ~9%，属"远看地图"） | 渲染图测量 |
| 镜头身份 | 两面墙 + 地面 + 墙角清晰可见；不是俯视图、不是正视图 | 人工判定 |
| 地板可行走区 | ≥ 可视地面 45%（沿用 room-map uv [0.06,0.94]，回归 test-room-map 保证） | 现有测试 |

### 4.2 内容密度（Composition）

| 指标 | 门槛 |
| --- | --- |
| 大锚点 | 恰好 1 个主锚点（唱片墙/唱机柜/放映墙之一为最强），其余不超过 3 个次级锚点 |
| 中型元素 | 3–5 个（落地灯、吉他、音箱、植物、茶几） |
| 小型生活痕迹 | ≥ 4 类（杂志/杯子/线材/小摆件），总面积 ≤ 地面 8%，不遮挡角色路径 |
| 唱片墙 | 占背景墙面积 25%–40%（spec §6.4）；2–3 层胡桃木层板；封套/黑胶/海报混排；非均质网格 |
| 三角视觉结构 | 唱片墙 → 角色/唱机 → 放映墙 三点均可一眼定位（截图缩小到 25% 仍可分辨，spec §6.4 视觉验收） |

### 4.3 材质与灯光（Asset / Lighting）

| 指标 | 门槛 | 测量方式 |
| --- | --- | --- |
| 材质六族 | 墙面（哑光颗粒）/ 胡桃木（木纹方向+边缘高光）/ 黑胶（同心纹+反射高光）/ 金属 / 织物 / 玻璃 全部存在且两两可区分 | 人工判定 + 局部 200% 放大截图 |
| 独立灯光层 | ≥ 4 个可独立开关/调强的灯光图层（见 §6），底图不烘焙主光照 | 生成器输出清单 |
| 角色受光 | 角色层位于暖光叠加层之下；2700K 时角色有暖色轮廓，6000K 时转冷 | 两种色温渲染对比图 |
| 冷暖对比 | 窗外/夜景区域平均色相为蓝（H 200–240），室内受光区为暖（H 20–45） | sharp 区域采样脚本 |
| 角色落地 | 脚底接触阴影存在；阴影方向与主光源一致（左上 → 右下投影） | 人工判定 |
| 遮挡正确 | 角色行至沙发/柜体后方时被正确遮挡（z 同轴比较） | room 页走位截图 |

### 4.4 最终判断（RESET-SPEC §34，人工判定）

1. 删掉 Logo/按钮/文案，只剩房间，仍能认出"深夜音乐空间"。
2. 删掉房间，只剩 UI，页面立刻变成普通 App（证明房间是视觉核心）。

### 4.5 ui-reference 基准图缺口的处理

7 张页面基准图当前不存在。决策：

- **Phase 1 产出 `room-master.png` 渲染图，过审后即作为 `reference-assets/ui-reference/room.png`**，并派生 home 的临时基准。
- 其余页面基准在各 Phase 定稿时从 Master 派生补齐，不允许先用旧截图充数（旧截图已在 `baseline/` 归档，仅作前后对比，不作验收目标）。

---

## 5. 家具统一数据模型

### 5.1 目标 schema（`utils/room-layout.js` 由生成器输出，单数据源）

```js
{
  id: 'sofa',                        // 稳定 key，碰撞/hotspot/DIY 状态共用
  label: '沙发',                      // architect 网格与提示气泡文案
  asset: '/assets/img/furn/sofa-main.webp',       // 全幅同坐标系覆盖层
  thumb: '/assets/img/furn/furn-thumb-sofa.webp', // architect 同源缩略图（替代 furn-icon-*）

  // 位置与渲染（全幅覆盖层方案下为声明性元数据，供 hitArea/collision/缩略图裁切使用）
  anchor: { x: 51.5, y: 64.0 },      // stage 百分比，家具视觉中心/交互锚点
  bounds: { left: 38, top: 55, width: 27, height: 16 }, // stage 百分比包围盒
  scale: 1,
  rotation: 0,
  z: 639,                            // 与角色 z = top*10 同轴；生成器统一分配

  // 光照与遮挡
  lightResponse: { warm: 0.9, cool: 0.25, emissive: 0 },  // 受暖光/冷光系数、自发光（霓虹/屏幕）
  occludesCharacter: true,           // 显式声明，替代 z 值隐式约定

  // 交互与碰撞
  hitArea: { left: 40, top: 56, width: 23, height: 12 } | null,  // 可点击区域；null = 纯装饰
  collision: { u0: 0.30, v0: 0.42, u1: 0.62, v1: 0.70 } | null,  // uv 参数化矩形；null = 可跨越
  fixed: false,                      // true = 固定件（茶几/地面唱片），不参与 DIY 显隐
  interaction: 'sit' | 'lamp' | 'projector' | 'records' | 'play-hint' | null
}
```

### 5.2 关键决策

1. **碰撞并入生成器**：`room-map.js` 手写的 `OBSTACLES` 迁移为由 `room-layout.js` 的 `collision` 字段构建；`setActiveFurniture` 逻辑不变。消除双源漂移。test-room-map 的 19 项断言同步改为从布局数据驱动，断言数不减少。
2. **`occludesCharacter` 显式化**：渲染层仍按 z 排序（兼容现有角色 z=top×10 机制），但数据模型显式声明，便于 QA 检查和未来调整。
3. **全幅覆盖层方案保留**（见 5.3），`anchor/bounds` 为声明性元数据；`lightResponse` 先声明、随灯光图层架构实现（Phase 1–2）。
4. `depthFor` 景深上限从实际 1.08 收敛到 spec 的 1.05（一处常量修正，随 Phase 2 做）。

### 5.3 渲染方案决策：继续全幅同坐标系覆盖层

候选：A) 全幅 828×828 透明覆盖层（现状）；B) 局部小图 + x/y/scale 定位。
**选 A**。理由：与现有管线/坐标系零迁移成本；家具位置由生成器精确控制，不存在运行时定位误差；13 层 webp 合计 <100KB 可接受；hitArea/collision 用百分比元数据同样精确。B 的优势（运行时移动家具）超出 Demo 需求。

---

## 6. Lighting Layer 架构（禁止全屏 CSS 渐变作为主光照）

### 6.1 架构

灯光改为**生成器输出的独立图层资产**，CSS/JS 只控制各层 `opacity`（和极少量 blend），禁止再用 `linear-gradient` 全屏蒙版（当前 `.art-tint`）和全局 `brightness()` filter（当前 `.lamp-off`）承担空间光照。

```text
Z 序（自上而下）                     控制源
─────────────────────────────────────────────────
HUD / 气泡 / 播放器                   页面
L7 projector-beam.webp      放映光束+幕布色光    projector 开关
L6 warm-light-soft.webp     暖光薄纱（低 alpha，罩角色）  色温 + lampFactor   ← 角色受光的关键
── 角色层（z = top×10，随景深插入）──
L5 lamp-pool.webp           落地灯局部光池        lamp 开关
L4 shelf-edge-glow.webp     层板/唱片墙暖边       常开（弱）
── 前景家具层（z 610–810）──
L3 warm-light-room.webp     室内暖光洗（墙/地/家具）色温插值主层
L2 cool-night-window.webp   窗外冷光溢入          色温插值（反向）
L1 ambient-shadow.webp      AO / 接触阴影 / 暗角  固定
L0 room-base.webp           中性材质基底（不烘焙主光照）
```

### 6.2 色温实现

- 2700K ↔ 6000K = `L3 warm-light-room` 与 `L2 cool-night-window` 的 opacity 反向插值（`t = (K-2700)/3300`），外加 `L6` 薄纱同步衰减。
- 落地灯开关 = L5 opacity 0/1 + L3/L6 整体系数 `lampFactor`（1.0 / 0.25），不再用 filter 改全图亮度。
- 放映机开关 = L7 opacity + 幕布区域由底图内发光面承担。
- 角色受光规则：**L6 必须在角色之上**（低 alpha 暖薄纱），使角色出现暖色轮廓；角色其余光照直接绘制进精灵（同光源方向）。

### 6.3 与数据模型的联动

`lightResponse` 字段为每件家具声明受光系数；Phase 1 先在生成器内用它决定各家具在 L3/L4/L5 图层中的受光绘制强度（烘焙进各灯光层的对应区域），运行时不做逐家具实时计算（Demo 性能约束）。

---

## 7. `room-scene` 组件数据接口

### 7.1 组件定位

`miniprogram/components/room-scene/`：**纯渲染组件，零业务逻辑**。不 import player / room-sync / storage；不寻路、不碰撞、不写缓存。

### 7.2 接口定义

```js
properties: {
  // 场景配置（页面从 roomie_room + records.js 归一化后传入）
  floor:      { type: String, value: 'walnut' },      // 地板 key（FLOOR_COLORS）
  lightTemp:  { type: Number, value: 2700 },          // 2700–6000
  furniture:  { type: Array,  value: [] },            // 已选家具 id 列表（驱动显隐）
  records:    { type: Array,  value: [] },            // 唱片墙槽位封面数据（≤12）
  lampOn:      { type: Boolean, value: true },
  projectorOn: { type: Boolean, value: false },

  // 角色（0–2 个；页面负责移动/插值/帧切换，组件只渲染）
  characters: { type: Array, value: [] },
  // [{ id:'momo', x, y, frame:'idle|walk-a|walk-b|sit', facing: 1|-1 }]
  // 组件内部完成：景深 scale = depthFor(y)、z = y*10、scaleX(facing)、脚底阴影

  // 模式
  mode: { type: String, value: 'interactive' },       // 'interactive' | 'duo' | 'preview'

  // 反馈层（可选）
  nowPlaying: { type: Object, value: null },          // 唱盘旋转/正在播放徽章
  bubbles:    { type: Array,  value: [] },            // [{ id, x, y, text, kind }]
}

// 组件 → 页面（triggerEvent）
'tap'         { x, y }            // stage 百分比坐标（组件负责触点归一化）
'furnituretap'{ id }              // 命中 hitArea 的家具
```

### 7.3 组件内部职责（下放的渲染栈）

底图 L0 → 环境阴影 L1 → 冷光 L2 → 暖光洗 L3 → 地板 tint（clip-path 菱形，菱形坐标由 room-map 唯一导出，不再 WXSS 手写）→ 层板暖边 L4 → 唱片槽位 → 家具覆盖层（按 z）→ 落地灯光池 L5 → 角色（按 z 插入）→ 暖薄纱 L6 → 放映光束 L7 → bubbles/徽章。

### 7.4 明确不做

不持有：Player 订阅、RoomSync 连接、路径动画计时器、`roomie_room` 读写、邀请/保存等任何业务动作。页面删掉场景代码后，room 页剩余 = 寻路+交互状态机，duo 页 = 同步+插值，architect 页 = DIY 表单状态。

---

## 8. Room / Duo / Architect 共享 RoomScene 的边界

| 能力 | room | duo | architect | 归属 |
| --- | --- | --- | --- | --- |
| 底图/灯光层/地板 tint/唱片槽位/家具层 | ✓ | ✓（补齐当前缺失） | ✓ | 组件 |
| 角色渲染（景深/朝向/帧） | 1 角色 | 2 角色 | 1 静态角色或 0 | 组件渲染，页面驱动数据 |
| 点击 → 归一化坐标 | ✓ | ✓（仅本端移动） | ✗（点击穿透到家具网格逻辑不需要） | 组件上报，页面决定是否寻路 |
| 寻路 / 碰撞 / clamp | ✓ | ✓（同 room-map） | ✗ | 页面调 room-map |
| 家具 hitArea 交互气泡 | ✓ | ✓ | ✗（选中态在下方网格表达） | 页面 |
| DIY 显隐（furniture 列表） | 读存储 | 读存储 | 编辑中状态 | 页面传入，组件只渲染 |
| 地板/灯光实时预览 | onShow 应用 | onShow 应用 | 拖动即时预览，保存写存储 | 页面 |
| 播放同步 / peer 插值 | — | ✓ | — | 页面（room-sync） |
| 同步/同频度 overlay | — | ✓ | — | 页面（HUD 层，不进组件） |
| 保存（roomie_room 写入） | — | — | ✓ | 页面 |

边界判据一句话：**"换一套皮肤要改的东西"进组件，"换一套产品逻辑要改的东西"留页面。**

迁移预期收益：消除三页拷贝的 250–350 行；duo 自动获得灯光/地板/热点能力；architect 预览与 room 几何天然一致（修掉当前 108% 宽错位）。

---

## 9. Phase 0 → Phase 1 的交接清单

进入 Phase 1 前最后动作（随确认执行）：

1. 执行 §3.4 废弃清理（删除 2 个旧脚本、归档 hero-art 与 gen_*.py、删误命名截图）。
2. 提交：`phase-0: engineering foundation (freeze, validation dirs, interfaces)`。

Phase 1 开工时的输入：

- 本计划 §4（验收指标）、§5（数据模型）、§6（灯光架构）作为生成器改造需求；
- `reference-assets/room-inspiration/` 6 张参考作为构图/材质/密度灵感；
- `visual-validation/baseline/room.png` 作为"before"对照。

Phase 1 的出口（过 QA 才准进 Phase 2）：

- `room-master.png` 渲染图 + 灯光分层资产 + 重绘家具/唱片/角色；
- §4 全部指标测量记录（`visual-validation/diff/room-master-*.md`）；
- §4.4 两条人工最终判断通过；
- 功能回归全绿（Phase 1 不改逻辑，预期零影响）。

---

**等待确认。确认后执行 §9 交接清单并进入 Phase 1（Room Master Scene 制作）。**
