# WEB-DEMO-AUDIT.md — Roomie Web Demo 代码审计报告

日期：2026-10-08
范围：`preview-app/`、`miniprogram/assets/`、`miniprogram/utils/`、`miniprogram/components/room-scene/`、`tools/`、`visual-validation/`
性质：**只读审计，未修改任何代码。**

---

## 0. 结论速览

现有 `preview-app/` 是 9 个**零 JS、零导航、纯静态**的 HTML 复刻页（为缺开发者工具时期提供视觉证据而做），房间场景全部基于 **Phase 4 之前的旧资产**（`legacy-assets/room-hero.webp` 整图平铺）。它不能直接作为 Web Demo，但页面结构、文案、CSS 习惯是宝贵参考。

好消息是：`miniprogram/` 里的核心逻辑——**Player 状态机、room-scene 布局数据、寻路、命中检测、唱片数据、同步协议——全部是无 wx 依赖的纯 JS**，可近乎原样搬进 Web Demo。真正需要新写的只是：DOM 渲染层（替代 WXML）、wx API 适配层、路由、以及 Vite 工程壳。

---

## 1. preview-app 当前状态（审计重点）

### 1.1 文件清单

- 9 个独立 HTML：`home / room / duo / friends / architect / song / profile / postcard`，外加 `legacy-assets/`（53 个 WebP，~253KB）、`shots/`（8 张 780×1688 截图）、`shots-real/`（**空目录**，真机截图从未产出）。
- **没有 index.html、没有 JS、没有构建配置、没有任何交互**：grep `<script|<a href|onclick|addEventListener` 全部为零。页面之间没有任何链接——当前不存在导航图，Demo 链路只存在于手动开文件和 shots 截图序列。
- 所有页面固定 `width: 390px; min-height: 844px`，px 值是 rpx×0.52 的换算残留（`13.52px` 之类）。
- 设计令牌（深夜底色 `#0C1424`、米色 `#F6EFDD`、绿 `#2FBF71`、琥珀 `#F0A93C` 等）以硬编码形式**逐页重复**，无 CSS 变量。
- 字体只用系统栈，从未加载仓库根 `fonts/` 下的 Oranienbaum / MiSans / NotoSerifSC。

### 1.2 逐页判定

| 页面 | 现状 | 判定 |
|---|---|---|
| home.html | hero 用 `legacy-assets/room-hero.webp` 整图 + 静态 Player + 死 tabbar | 结构/文案参考；场景必须换 Master 资产 |
| room.html | **旧 CSS 房间场景**：一张 `room-hero.webp` 平铺 + 一个硬编码坐标角色，无热点、无分层、无交互 | **必须完全替换**——移植 `components/room-scene` + `room-scene-layout.js` |
| duo.html | 同样平铺 `room-hero.webp` + CSS 波形动画（全站唯一动效）+ 静态 Player | 同上，场景必须替换 |
| friends.html | `legacy-assets/friends-village.webp` + 死按钮 | 场景应换为 `assets/img/vignette-*.webp`（Master 派生，已在主包） |
| architect.html | 预览图还是 `room-hero.webp`；家具格子用 13 个 `furn-icon-*.webp`（已零引用的旧图标）；灯光滑块是假的 | 必须重构：预览换成实时 room-scene，图标换成 `furn-thumb-*.webp` |
| song.html | 纯 CSS 唱机，进度条冻结在 49.8%，无 audio | 结构参考；需接 Player 状态机 + HTML5 Audio |
| profile.html | 8 个 CSS 色块假唱片墙 | 结构参考；唱片应用 `cover-{1..24}.webp` |
| postcard.html | `<img src="../miniprogram/assets/img/room-postcard.jpg">` 一张**预烘焙旧 JPEG**（注释自认"模拟 canvas 成品"） | **必须替换**为 Canvas 2D 实时合成（浏览器 Canvas 支持 WebP，可直接用 `room/` 层，也可用 `pc/` PNG 层） |

### 1.3 静态 Player（旧实现）

`home.html:192-208`、`room.html:53-69`、`duo.html:95-111` 三处复制粘贴同一个假 Player（黑胶图 + 晴天/周杰伦 + 冻结进度 + 无 audio）。**判定：必须替换**为由 `utils/player.js` 驱动的真实组件。

### 1.4 legacy-assets 定性

- `room-hero.webp`（5 页引用）、`friends-village.webp`、`room-interactive.webp`、全尺寸 `furn-*.webp` ×13、`rec-*.webp` ×24、`room-postcard.jpg`：**全部是 Phase 4 之前的旧场景资产，必须替换**。RC 文档已定性它们"仅 preview-app 旧复刻页在用，小程序零引用"。
- `furn-icon-*.webp` ×13：旧双色图标，小程序已零引用。Architect 选择器应改用主包内的 `furn-thumb-*.webp`。
- `shots/*.png`：旧设计截图，可留作历史基线，不作为新 Demo 的验收基准（基准应用 `reference-assets/ui-reference/`）。

---

## 2. miniprogram 侧可复用资产（审计重点）

### 2.1 Room Master 资产（Phase 4 现行真源，`miniprogram/assets/img/room/`）

由 `tools/gen-room-master.js` 程序化生成，828×828 等距场景：

- **灯光层 L0–L7 ×8**：`room-base / ambient-shadow / cool-night-window / warm-light-room / shelf-edge-glow / lamp-pool / warm-veil-char / projector-beam`（均 .webp，15–96KB）
- **家具覆盖层 ×14**：`furn-{sofa,vinyl-player,table,cat-bed,lamp,plant,rug,curtain,projector,poster,coffee,bookshelf,doll,guitar}.webp`（全画布 overlay，与层同坐标系）
- **家具缩略图 ×13**：`furn-thumb-*.webp`（Architect 用）
- **唱片板材 ×24**：`rec-plate-{1..24}.webp` + 唱片封面 `assets/img/cover-{1..24}.webp`（Profile 用）

### 2.2 角色资产

`assets/img/char-{momo,kiki}-{idle,walk-a,walk-b,sit}.webp` ×8（144×184 精灵，`spriteAspect=1.2778`）。左向用 `scaleX(-1)` 翻转。

### 2.3 Song 资产

`song-disc.webp`、`song-hifi-bg.webp`、`song-sleeve-{sunny,sea,night}.webp`。**注意：全仓库无任何音频文件**——小程序播放器就是 mock 定时器。Web Demo 若要有声，需自备合法 Demo 音频走 HTML5 Audio；否则直接复用 mock Player 也完全符合现状（SUBMISSION.md 已声明无真实音频流）。

### 2.4 设计令牌

单一真源：`miniprogram/app.wxss`（238 行）——完整 night/paper/green/amber/walnut 色族、字号（rpx）、间距（4px 基）、圆角、阴影、`.card/.pill/.btn-*/.en-serif` 共享类。Web Demo 将其转成 CSS 变量即可，**一个值都不该新发明**。字体：仓库根 `fonts/` 有 Oranienbaum + MiSans ×4 + NotoSerifSC TTF，可直接 `@font-face`（MiSans 单字重约 8MB，建议子集化或只引 Regular）。

### 2.5 Postcard Canvas 资产

`assets/img/pc/` ×44（PNG/JPG 700×700）。其存在原因是**微信 Canvas 不解码 WebP**——浏览器无此限制。Web Demo 可二选一：直接用 `room/` WebP 层，或稳妥起见复用 pc/ 层（推荐后者，合成参数已被小程序验证）。

---

## 3. 核心逻辑审计（room-scene-layout / Player / 数据模型）

### 3.1 `utils/room-scene-layout.js`（14.5KB，生成产物，勿手改）

Room Master 的单一数据真源：GEOMETRY（canvas 828、原点 414,235、SX 480/SY 250）、LAYERS L0–L7 路径、FURNITURE ×14（anchor/bounds/z/hitArea/collision/interaction/hotspot）、FIXTURE_OBJECTS、RECORD_SLOTS ×12、PLATTER、CHAR。**纯数据，零 wx 依赖，Web Demo 原样 import（CommonJS 转 ESM 一行事）。**

### 3.2 `components/room-scene/`（组件本体）

- 图层不透明度公式 `layerOpacity(lightTemp, lampOn, projectorOn)`：t=(K−2700)/3300，L2/L3 反向插值、L5 随灯、L7 随放映机——**纯函数，直接可搬**（离线镜像见 `tools/lib-scene-compose.js`）。
- z 栈排序、角色景深缩放（0.82–1.05）、脚底锚定 `translate(-50%,-100%)`、record 槽位填充——全部可在 DOM 复现，WXSS 用的 `mix-blend-mode: screen` 浏览器原生支持（且比 sharp 离线合成更接近微信运行时表现）。
- 命中管线：tap → 归一化为舞台百分比 → `RoomHit.hitTest`（z 序矩形+射线法多边形）→ `furnituretap` 或 `stagetap`（寻路）。**hitArea（交互）与 collision（移动）严格分离**，这套纪律要在 Web 版保持。
- **判定：逻辑必须移植，WXML/WXSS/observers 必须重写成 DOM 渲染**（这是本次 Web Demo 最大的重构点）。

### 3.3 Player 状态机（`utils/player.js`，5KB）

单例 pub/sub 状态机：3 首 mock 歌单（晴天/花海/夜曲，带时间戳歌词）、1s tick、toggle/play/next/prev/switchTo/seek/snapshot/applyRemote（last-write-wins + 2.5s 容差 + 延迟补偿）。**不含任何 wx API，连 `wx.createInnerAudioContext` 都没用——全项目音频本来就是 mock。** Web Demo 原样复用；要真出声就在 seek/tick 处接一个 `<audio>` 适配器。

### 3.4 数据模型（storage keys）

| Key | Schema | 读写点 |
|---|---|---|
| `roomie_room` | `{floor:'blue-gray'\|'walnut'\|'slate', lightTemp:2700–6000, lightBright:0–100, furniture:[ids]}` | app.js 统一 `normalizeRoom`/`saveRoom`；architect 写，home/room/duo/postcard 读 |
| `roomie_records` | 唱片 id 数组（1–24，最多 12），默认 `[1,2,3,5,8,19]` | profile 写；`RecordsUtil.readSelection` 读（已做非法 id 过滤，**storage getter 是注入式参数——直接传 localStorage.getItem 即可**） |
| `roomie_unread` | 数字角标 | app/messages/tabbar |
| `roomie_avatar` / `roomie_outfit` | `{path,name,size,at}`，2MB 上限 | avatar.js（依赖 FileSystemManager，需重写为 blob/dataURL + localStorage/IndexedDB） |

Web 适配：`wx.getStorageSync/setStorageSync/removeStorageSync` → localStorage 包装器，同步 API 形状完全一致，改一处全局生效。

### 3.5 页面 → Web Demo 映射

小程序 10 页中，Demo 链路 8 页全部有现成逻辑：home / room / duo / friends / architect / song / profile / postcard。`create` 和 `messages` 不在链路内，可折进 Web 导航或省略。每页逻辑规模参考：room.js 16KB（最重：寻路+热点+同步+气泡）、duo.js 11.6KB、postcard.js 12.7KB（Canvas 合成）。

---

## 4. 需要 Web adapter 的微信 API 全清单

| 类别 | wx API | Web 替代 |
|---|---|---|
| 存储 | `getStorageSync / setStorageSync / removeStorageSync` | localStorage 包装（同名同步签名） |
| 导航 | `navigateTo / navigateBack / switchTab` | History API 路由（hash 或 history 模式） |
| UI 反馈 | `showToast`（约 20 处）/ `showModal` / `showActionSheet` | 三个全局 Web 组件（toast/modal/actionsheet），复刻交互语义 |
| 系统 | `getWindowInfo`（statusBarHeight/pixelRatio）、`nextTick` | `visualViewport`/`devicePixelRatio`/`Promise.resolve().then`；Web Demo 自定安全区 |
| Socket | `wx.connectSocket`（room-sync.js，连 `ws://127.0.0.1:8765`） | 原生 `WebSocket`（签名 shim 不到 50 行）；**离线演示直接用现成的 `startSimPeer` 模拟对端** |
| 媒体/文件 | `chooseMedia / chooseMessageFile / getFileSystemManager / USER_DATA_PATH` | `<input type=file>` + dataURL/blob + localStorage/IndexedDB |
| Canvas | `createSelectorQuery` / `canvasToTempFilePath` / `saveImageToPhotosAlbum` / `openSetting` | DOM `getBoundingClientRect` / `canvas.toBlob` → `<a download>` |
| 分享 | `showShareMenu / onShareAppMessage` | Web Share API（`navigator.share`）降级复制链接 |
| 框架 | `App/Page/Component/getApp/getTabBar/observers/slider/scroll-view/rpx` | 原生 DOM + 自实现微型 pub/sub（player.js 已有范式）；slider→`<input type=range>`；rpx→以 390px 视口为基准的换算 |

**全项目未使用**：`wx.createInnerAudioContext`、`wx.request`、`wx.login`、`wx.vibrateShort`——适配面比想象小。

---

## 5. 可复用 / 必须重构 / 旧实现 总表

### 5.1 原样可复用（纯 JS / 数据 / 资产）

- `miniprogram/utils/room-scene-layout.js`（Master 数据真源）
- `miniprogram/utils/player.js`（Player 状态机）+ `tools/test-player.js`（25 项断言直接可跑）
- `miniprogram/utils/room-hit.js`（命中检测）
- `miniprogram/utils/records.js`（唱片库）
- `miniprogram/utils/room-map.js`（A* 寻路/景深/碰撞）——**一处小改**：顶部 `require('./room-layout')`（legacy）改为显式传入 `room-scene-layout`，只走 `createMap(GEOMETRY, SceneLayout)` 新路径；配套 `tools/test-room-map.js` 39 项断言可跑
- `miniprogram/assets/` 全部（room/ 灯光层、家具、角色、唱片、song、vignette、pc/）
- `miniprogram/app.wxss` 令牌 → CSS 变量
- `fonts/` TTF
- `tools/sync-server.js` + `test-sync.js`（Duo 同步服务器与协议，浏览器 WebSocket 原生兼容）
- `tools/lib-scene-compose.js`（L0–L7 合成语义规范）
- `tools/make-diff.js`（纯 sharp 并排 diff，Web 截图验收直接用）
- `reference-assets/ui-reference/*.png` ×7 + `visual-validation/*-reference-spec.md`（现成视觉回归基准）

### 5.2 必须重构（算法可搬，框架绑定要重写）

- `components/room-scene/` → Web 组件（DOM 渲染 + 同样的 layer/z-stack/hit 管线）——**最大重构点**
- `pages/room/`、`pages/duo/` 页面逻辑（移动插值、7 条家具动作链、气泡、同步订阅）——契约即 `tools/test-room-player-sync.js` 的 19 项断言
- `pages/postcard/` Canvas 合成 → Canvas 2D + `toBlob` 下载
- `utils/avatar.js` → localStorage/IndexedDB
- `utils/room-sync.js` → WebSocket shim（或演示模式只用 simPeer）
- `mini-player`、`roomie-header`、`custom-tab-bar` 三组件 → Web 组件 + 真路由链接
- 所有 `showToast/showModal/showActionSheet` 调用点 → Web UI 适配层
- `tools/shot-page.js / final-sweep.js / verify-room-runtime.js` → Puppeteer/Playwright 版（10 页路由清单和"计数图层/热点/角色 + 几何测量"探针思路直接沿用）
- `tools/measure-room-master.js` → 输入换 Web 截图，12 项阈值判定逻辑保留

### 5.3 旧实现 / 不要带进 Web Demo

- `preview-app/legacy-assets/` 全部（room-hero、friends-village、room-interactive、furn-*、rec-*、furn-icon-*）及 `room-postcard.jpg`
- `miniprogram/utils/room-layout.js`（旧 274/144 几何，引用已不存在的资产路径）
- `tools/gen-room-scene.js`、`gen-friends-village.js`、`make-room-master-diff.js`、`mcp-*.js`、`wx-*.bat`、`archive/`
- `preview-app/` 现存 9 个 HTML（仅作结构/视觉/文案参考）
- `preview-app/shots/`（旧设计截图，仅历史基线）、`shots-real/`（空目录）

---

## 6. 必须真正实现的功能清单（当前全是假的）

1. **路由与导航**：当前页面间零链接。需实现 Home→Room→Friends→Duo→Architect→Postcard 全链路 + tabbar。
2. **房间场景**：从整图平铺换成 L0–L7 分层 + 家具 overlay + 角色，灯光公式、z 序、景深全部真实计算。
3. **家具互动**：7 条热点动作链（落地灯/放映机/唱片墙/唱机/沙发/吉他/地面唱片）+ 点地寻路移动（A*）。
4. **Player**：接入 player.js 状态机，mini-player、room 唱机、song 页三处联动；可选 HTML5 Audio 真实发声。
5. **状态持久化**：roomie_room / roomie_records 经 localStorage 真实读写，Architect 修改 → Room/Postcard 反映（DIY 闭环）。
6. **Duo**：优先 simPeer 模拟对端（零服务器依赖）；可选 sync-server.js 真双人。
7. **Postcard**：Canvas 2D 实时合成 + toBlob 下载，替换预烘焙 JPEG。
8. **邀请流程**：Friends 邀请 → 模拟接受 → 进 Duo。

---

## 7. 推荐目录结构

`preview-app/` 作为正式 Web Demo 重写（Vite + 原生 HTML/CSS/JS，不引框架）。旧 HTML 移至 `preview-app/legacy-pages/` 保留参考，与 `legacy-assets/` 同级隔离，构建不打包。

```
preview-app/
├── package.json            # vite 唯一依赖
├── vite.config.js          # 多页或 SPA 入口；assets 引用 ../miniprogram/assets
├── index.html
├── legacy-pages/           # 旧 9 个 HTML（参考留存，不进构建）
├── legacy-assets/          # 旧资产（参考留存，不进构建）
├── shots/                  # 旧截图（历史基线）
├── public/
│   └── assets/             # 构建期从 miniprogram/assets 同步（或 vite alias 直引）
├── src/
│   ├── app.js              # 入口 + 路由表
│   ├── pages/
│   │   ├── home.js  room.js  duo.js  friends.js
│   │   ├── architect.js  song.js  profile.js  postcard.js
│   ├── components/
│   │   ├── room-scene/     # 移植 components/room-scene（DOM 渲染器）
│   │   ├── mini-player.js  tab-bar.js  header.js
│   │   └── toast.js  modal.js  action-sheet.js
│   ├── state/
│   │   ├── player.js       # 原样搬自 miniprogram/utils
│   │   ├── room-map.js     # 原样搬（去 legacy require）
│   │   ├── room-hit.js     # 原样搬
│   │   ├── records.js      # 原样搬
│   │   ├── room-scene-layout.js  # 生成产物，与 miniprogram 同步（勿手改）
│   │   └── room-store.js   # roomie_room/roomie_records 读写 + normalizeRoom
│   ├── adapters/
│   │   ├── storage.js      # wx storage → localStorage
│   │   ├── navigation.js   # wx.navigateTo → 路由
│   │   ├── audio.js        # Player ↔ <audio>（可选）
│   │   ├── socket.js       # wx.connectSocket → WebSocket / simPeer
│   │   └── share.js        # Web Share API 降级
│   └── styles/
│       ├── tokens.css      # app.wxss 令牌 → CSS 变量
│       ├── base.css        # 重置 + 字体 @font-face
│       └── viewport.css    # PC 居中 390×844 视口 + 深夜环境；移动端铺满
└── tests/                  # 移植 test-player / test-room-map（纯 Node 可跑）
```

**PC 外壳**：`viewport.css` 居中 390×844 Roomie 视口，外层深夜环境（令牌 `--night-950 #08111D` 渐变），移动端直接响应式铺满——与现状的固定 390px 思路一致，但用 CSS 变量 + `min()` 实现。

---

## 8. 风险与注意事项

1. **灯光混合差异**：sharp 离线 screen 合成略暗于浏览器 `mix-blend-mode: screen`；视觉验收阈值以浏览器实测为准（项目已有此先例）。
2. **无音频资产**：全项目无音频文件。Demo 链路中的"播放"默认走 mock Player（与小程序一致）；若要出声需自备合法 Demo 音频，不接任何版权音源。
3. **room-map.js 的 legacy 依赖**：顶部默认导出走旧 `room-layout.js`（资产路径已失效）。Web 版必须只走 `createMap(GEOMETRY, room-scene-layout)` 新路径。
4. **room-scene-layout.js 是生成产物**：Web Demo 中保持与 miniprogram 同步拷贝，改动走 `node tools/gen-room-master.js` 重新生成，勿手改。
5. **不要用 `preview-app/shots/` 当验收基准**：那是视觉重置前的旧设计。基准用 `reference-assets/ui-reference/`。
6. **字体体积**：MiSans 单字重约 8MB，NotoSerifSC 约 14MB——直接全量加载会拖垮首屏，需子集化或按字重取舍。
7. **pc/ 资产约束仅属微信**：浏览器 Canvas 可解码 WebP，postcard 可直接用 `room/` 层；但复用 pc/ 层可继承小程序已验证的合成参数，推荐后者。

---

*审计完成，未修改任何代码。等待确认后进入第二阶段（实施）。*
