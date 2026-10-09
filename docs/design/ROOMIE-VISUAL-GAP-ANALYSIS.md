# ROOMIE 视觉差距分析（Visual Gap Analysis）

> 文档性质：审计报告，**本次未修改任何代码**。
> 审计日期：2026-10-05
> 依据文档：`docs/product/ROOMIE-DEVELOPMENT-MANUAL.md`、`docs/product/ROOMIE-MINIPROGRAM-SPEC.md`、`docs/design/ROOMIE-VISUAL-DESIGN-SPEC.md`、`docs/design/ROOMIE-VISUAL-ASSET-RESET-SPEC.md`、`.kimi-code/skills/` 三个 Roomie 技能。
> 证据来源：`miniprogram/` 全量代码、`tools/` 生成脚本、`preview-app/shots/*.png`（2026-10-05 截图）、`figma-assets/`、`reference-assets/`。

---

## 1. 当前状态

### 1.1 功能层（健康，不动）

- 10 个页面、五项自定义 Tab、Player 单例、room-sync、room-map（A*/碰撞/景深）、DIY 持久化、唱片墙、Canvas 明信片均已实现并有自动化验证（test-player / test-sync / test-room-map / check-bindings 全绿）。

### 1.2 资产层（比预期好，但未达标）

- 资产全部由 `tools/gen-room-scene.js`（943 行手写 SVG→sharp）程序化生成：**分层架构已存在**——`room-interactive.webp` 底图（墙/地/固定装饰/烘焙暖光）+ 13 个 `furn-*.webp` 全幅透明覆盖层（同坐标系）+ 24 个 `rec-*.webp` 唱片板材 + `room-hero.webp` / `room-postcard.jpg` / `friends-village.webp`。
- 角色为 `tools/gen-characters.js` 生成的原创 Q 版团子（MOMO 橙 / KIKI 黄，idle/walk-a/walk-b/sit × 144×184），已取代早期小红书抠图素材（`tools/prepare-character-assets.js` 为废弃管线，仍残留仓库内，硬编码本机路径，**应清除**）。
- 风格判断：房间资产是"程序化矢量伪写实"（渐变木纹、同心纹黑胶、接触阴影、暖光池、暗角），**方向正确但密度和质感不足**；角色是扁平贴纸风，与房间不像同一个世界；建筑师模式的 `furn-icon-*.webp` 是墨黑+亮绿双色线性 icon，**与房间资产完全两个视觉体系**。

### 1.3 页面视觉（与目标差距最大处）

来自 `preview-app/shots/` 截图的客观事实：

- **房间不是主角**。home hero 容器高 760rpx（≈首屏 23%，spec 要求 48–56%），房间缩成悬浮在深底中的"卡片式插图"，周围大量空深蓝；room 页中段约 25% 纯空屏；duo 房间占 ~30%；architect 预览缩到顶部。
- **镜头是"远看地图"而非"等距微距"**。用户感觉在看小房间缩略图，不是站在房间门口。
- **灯光是 CSS 蒙版**：色温 = 一条全屏 linear-gradient（`.art-tint`），落地灯开关 = 全局 `brightness()` filter，**灯光不作用于角色**，无光源位置、无逐材质响应。
- **UI 基本达标**：设计令牌体系完整（颜色/字号/间距/圆角/阴影），纸张卡、pill、按钮全局类已被广泛消费，硬编码裸 hex 极少（57 处，集中在令牌定义与 song 页 CSS 材质）。

### 1.4 验收基础设施（缺失）

- `reference-assets/ui-reference/`（7 张视觉基准图）**不存在**。
- `visual-validation/`（reference/rendered/diff）**不存在**。
- 现有"视觉验收"= Chrome 截 HTML 复刻页后人工目检；`preview-app/shots-real/` 为空（真机截图从未产出）。

---

## 2. 目标状态

按 RESET-SPEC §34 的两个最终判断：

1. **删掉 Logo、绿色按钮和文案，只剩房间，它仍然像一个有完整世界观的深夜音乐空间**——等距微距、胡桃木/黑胶/织物/金属材质可分、2700K 暖光与窗外冷夜形成冷暖对比、唱片墙有收藏感、角色真正"住"在空间里（脚底阴影、遮挡、受光）。
2. **房间是所有相关页面的第一视觉主体**（home 48–56%、duo 55–62%），UI 退为悬浮信息层。
3. 一套 Room Master Scene 资产派生全部页面：room/duo/architect 同源渲染，friends 的 mini-room 由 Master 派生，song/profile/postcard 复用同一视觉语言。
4. 视觉验收有可执行的 reference → render → diff 循环，不再靠"目检合格"。

---

## 3. P0 必须重做

| # | 项目 | 现状 | 目标 |
|---|---|---|---|
| P0-1 | **Room Master Scene 构图与镜头** | 房间是页内小插图，远看视角 | 等距微距特写，房间充满 stage，用户"站在门口"视角；重建 scene coordinate system |
| P0-2 | **房间资产密度与生活感** | 底图偏空，固定装饰少，"没人住过" | 大锚点（唱片墙/唱机柜/放映墙/沙发）+ 3–5 中件 + 克制小噪点（杂志/杯子/线材），达到"有人生活过" |
| P0-3 | **唱片墙重绘** | 空槽虚线框 + 几何色块封面，偏"模块网格" | 2–3 层胡桃木层板、封套—黑胶—封套节奏、海报混排、大小/材质/色彩有层次、保留空隙 |
| P0-4 | **材质系统** | 所有物体同为"扁平矢量+渐变"单材质 | 墙（哑光颗粒）/胡桃木（木纹方向+边缘高光）/黑胶（同心纹+反射）/金属/织物/玻璃六族明确可分 |
| P0-5 | **灯光系统** | 全屏 CSS 渐变蒙版 + 全局 filter，角色不受光 | 光源位置化（落地灯光池、放映光束、层板暖边）、角色受光与暖色轮廓、墙面/地面/家具分级受光、冷夜外部对比 |
| P0-6 | **角色融入空间** | 扁平团子贴纸感，与房间不像同一世界；灯光不作用于角色 | 与房间同光源方向的绘制/描边与着色升级、落地接触、正确遮挡、受光 |
| P0-7 | **home 页构图** | hero 仅 ~23% 屏高，任务卡/播放器/CTA 瓜分视线 | 房间占 48–56% 为第一主角，UI 悬浮化 |

## 4. P1 应该重做

| # | 项目 | 说明 |
|---|---|---|
| P1-1 | **场景组件化（room-scene）** | room/duo/architect 三页各自拷贝场景 WXML/图层构建/色温函数/角色动画（重复 250–350 行），duo 已能力漂移（无灯光/地板/热点）。必须收敛为一个不持有业务逻辑的场景组件 |
| P1-2 | **家具数据模型补全** | `room-layout.js` 缺 `x/y/scale/rotation/lightResponse/occludesCharacter`；13 件家具仅 6 件有 hotspot、6 条碰撞，且 OBSTACLES（room-map.js 手写）与 hotspot（生成器输出）双源维护，漂移风险高 |
| P1-3 | **duo 页场景对齐** | 房间占比升至 55–62%，补齐灯光/地板/家具交互，MOMO+KIKI 在家具环境中互动，而非"两头像+95%" |
| P1-4 | **architect 家具缩略图** | 废弃 `furn-icon-*.webp` 双色 icon，改用与房间同源的真实家具缩略渲染（从 Master 资产生成）；修复预览图 108% 宽与覆盖层坐标的几何错位 |
| P1-5 | **friends mini-room 体系** | `friends-village.webp` 是一张整图+绝对定位 pill，不可拆分；应改为 Master 派生的 Variant A/B/C（换唱片墙/地板/沙发/海报配色），在线/离线有亮度与暖光差异 |
| P1-6 | **song 页视觉** | 纯 CSS 黑胶微场景（515 行 WXSS、12 处硬编码材质 hex）已实现但材质扁平；升级为与房间同语言的真实唱片/唱机资产化视觉，"从房间取出一张唱片" |
| P1-7 | **ui-reference 基准图 + visual-validation 目录** | 建立 7 页 reference/rendered/diff 体系，没有它一切视觉迭代不可验收 |

## 5. P2 可以优化

- **导航壳统一**：5 页用 roomie-header、song 自建 topbar、postcard/architect 用原生导航；song.json 导航背景 `#F7F3EA` 与深夜壳冲突。
- **令牌收尾**：`--cream: var(--night)` 错误别名；绿色有三个值（`#2BC96B`/`#22C55E`/`#2FBF71`）；app.json/tabBar json 配置色与令牌近似不等。
- **组件库补齐**：paper-card/status-pill/button 只有 CSS 类无组件封装；friends 私造 `.f-btn-*`、profile 私造 `.pill-ink`。
- **动效类名收敛**：`.anim-in` 与 `.rise-in` 两套、keyframes 复制约 5 份；多处"VISUAL RESET 二次覆盖块"应合并回主定义。
- **postcard Canvas 色值**在 JS 硬编码，与令牌脱钩；明信片可增加邮票/邮戳/手写感细节层次。
- **profile 页**：唱片墙网格与角色卡已可用，但房间缩略图应用 Master 派生图而非 hero 整图。
- **景深上限**：`depthFor` 实际 0.82–1.08，超出 spec 的 0.8–1.05。
- **duo 假数据**：`sync: 95+random` 需在演示叙事上处理。

---

## 6. 现有资产可复用清单

| 资产 | 处置 | 理由 |
|---|---|---|
| `tools/gen-room-scene.js` 分层生成管线（SVG→sharp、坐标系与 room-map 对齐） | **保留并扩展** | 这是最大存量优势：资产可程序化重生成，Master Scene 重建应在此基础上演进，不要换工具链 |
| `miniprogram/utils/room-layout.js` 生成器输出机制 | 保留机制、扩充字段 | 补 x/y/scale/lightResponse 等 |
| `miniprogram/utils/room-map.js` | **原样保留** | 边界/碰撞/A*/景深已验证，仅 OBSTACLES 应并入生成器单一数据源 |
| `char-momo/kiki-*.webp` 8 个精灵（文件接口 144×184） | **保留接口，重绘内容** | 页面逻辑不绑绘制来源，可在不改代码的情况下换更高质量角色 |
| `rec-*.webp` 唱片板材机制 + `utils/records.js` | 保留机制、重绘封面 | 封面设计与槽位/明信片共用链路已打通 |
| `friends-village.webp` 生成器（gen-friends-village.js） | 保留思路、改为 Variant 派生 | miniRoom() 参数化方向正确 |
| `app.wxss` 令牌体系 + 纸张卡/pill/按钮全局类 | **保留** | 已达目标 80%，只需收尾 |
| `roomie-header` / `mini-player` 组件 | 保留 | 复用良好 |
| 全部功能逻辑（player/room-sync/持久化/明信片流程） | **原样保留** | RESET-SPEC §30 明确 |
| `preview-app/` HTML 复刻截图管线 | 保留作为 rendered 来源 | 接入 visual-validation 体系 |
| `reference-assets/room-inspiration/` 6 张参考 | 保留作设计评审 | 不进运行时包 |

## 7. 必须新增的资产清单

按 RESET-SPEC §6 的目标结构，当前 **全部缺失**：

1. **Room Master 拆分资产**：`wall-left/wall-right/floor/projection-wall/window-night/ambient-shadow/warm-light-overlay/projector-light`（当前底图是烘焙单层，灯光无法独立控制）。
2. **灯光资产**：落地灯光池、放映光束、层板暖边、角色暖色轮廓层（当前全靠 CSS）。
3. **重绘家具**：sofa / turntable+cabinet / record-shelf / speaker / floor-lamp / table-lamp / guitar / plant / coffee-table / side-table / projector / armchair / rug——材质升级（木纹、织物、金属、玻璃），并输出 **architect 用同源缩略图** 取代 `furn-icon-*`。
4. **唱片墙资产**：胡桃木层板、封套/黑胶交替的收藏级封面组（原创抽象，避免版权）、海报。
5. **角色重绘**：MOMO/KIKI 与房间同光源、同材质语言的新版（保持 144×184 与四姿态接口）。
6. **生活痕迹小件**：杂志、杯子、线材、小摆件（克制量级）。
7. **Mini-room Variant A/B/C**：从 Master 派生，供 friends 使用。
8. **ui-reference 基准图 7 张** + `visual-validation/{reference,rendered,diff}` 目录与 diff 脚本。
9. **song 页唱片/唱机视觉资产**（替代纯 CSS 绘制中材质最弱的部分）。

## 8. 当前架构问题

1. **无场景组件**：三页拷贝 250–350 行场景代码，duo 已漂移——这是"每个页面重新生成一套房间"风险的代码形态，违反 RESET-SPEC §19-10。
2. **坐标双源/多源**：地板菱形同时硬编码在 room-map.js（像素）与两处 WXSS clip-path（百分比）；OBSTACLES 与 hotspot 字符串关联双源维护；家具 z（610–810）与角色 z（top×10）靠隐式约定对齐，无 `occludesCharacter` 声明。违反 §22 视觉坐标规范。
3. **底图烘焙过度**：暖光洗墙、暗角、固定装饰全部烘焙进 `room-interactive.webp`，导致灯光只能事后用 CSS 蒙版补救——这是"灯光不像空间光照"的技术根因。Master 重建必须让灯光层独立。
4. **视觉与逻辑耦合**：灯光靠父级 class 级联 filter；逻辑坐标直接拼内联 style。违反 §23。
5. **验收体系缺位**：无 ui-reference、无 diff 目录、真机截图管线空转，视觉结论无法证伪。
6. **废弃管线残留**：`prepare-character-assets.js`（版权风险素材+本机硬编码路径）、`compress-assets.js`（输出已不存在）、`figma-assets/hero-art*.png`（~20MB 无人消费）、根目录 20 个 `gen_*.py`（本机无 Python 时代的遗产）、`preview-app/shots$p.png` 误命名文件。应清理或归档，避免后续 agent 误用。
7. **证据可信度分层未执行**：HTML 复刻截图与真机表现存在已知差异（preview-app/room.html 的小房间 vs 代码中 room-frame 100vw 满屏），报告与验收必须分开标注。

## 9. 推荐重构顺序

严格对齐 `roomie-rebuild` 技能的门禁（Room Master 未过视觉 QA，不得批量改页面）：

```text
Phase 0  冻结现状
  · 归档当前 8 张 shots 为 baseline
  · 清理废弃管线（prepare-character-assets.js / compress-assets.js / hero-art*.png / gen_*.py 归档）
  · 建立 reference-assets/ui-reference/ 与 visual-validation/ 目录骨架

Phase 1  Room Master Scene（唯一目标，不过 QA 不前进）
  · 扩展 gen-room-scene.js：拆分墙/地/灯光/阴影为独立图层
  · 重建镜头（等距微距）与 scene coordinate system
  · 重绘家具 + 唱片墙 + 材质系统 + 灯光资产
  · 重绘角色（保持 144×184 接口）
  · 渲染 Master 单图，按 §34 两条最终判断验收

Phase 2  场景组件化 + 数据模型
  · 抽 room-scene 组件（不含业务逻辑）
  · room-layout.js 补全字段；OBSTACLES 并入生成器单一数据源
  · 回归：test-room-map / test-player / test-sync / check-bindings 全绿

Phase 3  Home（视觉母版页）
  · 房间占比 48–56%，UI 悬浮化
  · 截图 → diff → 修正，直到稳定

Phase 4  Room / Duo / Architect
  · 三页切换 room-scene 组件；duo 补齐灯光/地板/交互
  · architect 家具缩略图换同源真实渲染

Phase 5  Friends / Song / Profile / Postcard
  · friends mini-room Variant 体系；song 唱片视觉资产化
  · profile/postcard 复用 Master 派生图

Phase 6  UI 收尾（最后做）
  · 导航壳统一、令牌别名修正、组件封装、动效类名收敛

Phase 7  回归
  · 全部自动化测试 + JS syntax check + 9 步闭环人工路径 + 每页截图证据
```

**关键纪律**（来自 RESET-SPEC §27）：同一视觉问题连续三轮修不好，停止调 CSS，回到 layout / asset / camera / lighting / material / architecture 重新定层。

---

审计到此结束。**尚未修改任何代码、未生成新页面、未调整 CSS。** 等待确认后再进入 Phase 0。
