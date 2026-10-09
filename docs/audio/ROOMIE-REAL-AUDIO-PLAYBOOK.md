# ROOMIE-REAL-AUDIO-PLAYBOOK — Aruarian_Dance 真实音频接入与复现手册

> **⚠️ 更新（2026-10-09，web-cc0-audio-v1 起）**：本文档描述的 Aruarian_Dance 方案
> **已被替换**——该音源许可状态无法核验（unverified），已从 Web 运行时删除。
> Web Demo 现使用 3 首 CC0 1.0 器乐曲目（Ondrosik，核验记录见
> [AUDIO-CATALOG.md](AUDIO-CATALOG.md)。本文档保留作历史记录：其「小程序端寻址
> 方案」（§2–§6）对小程序侧仍然有效；**§7 的 Web 迁移计划已过时，勿再参照执行**。
> 另注：`preview-app/public/audio/aruarian-dance.mp3` 已 git rm，但历史提交中仍可能
> 含有该文件（未改写历史；如需彻底清理须由维护者评估 BGC/filter-repo，属未来事项）。

> 目标：任何人在任何机器上把工程拷过去后，按本文档操作能**一次通过**地复现
> 「唱片夹里有 Aruarian_Dance、点击真实发声、默认挂上唱片墙、miniplayer 首曲即它」。
> 写于 2026-10-09，对应 commit：records.js 25 张唱片 + player.js 真实音频层。

---

## 1. 成果速览（验收标准）

| 项 | 预期 |
|---|---|
| 「我的」页唱片墙网格 | 第 25 张唱片 **Aruarian_Dance**，几何画芯封面（cover-25.webp） |
| 点击该唱片 | 真实播放 `Nujabes - Aruarian Dance.mp3`，toast「♪ 正在播放」；**只挂墙不摘墙** |
| 新用户进模拟器 | miniplayer 第一首即 Aruarian_Dance（歌单 index 0，进度 0:00） |
| 房间唱片墙 | 默认 7 张（含 Aruarian_Dance 排最后），点墙循环展示 1/7 → 7/7 |
| 歌曲页 | 封套 `song-sleeve-aruarian.webp` 正常显示，歌词按时间戳高亮 |
| 明信片页 | `pc-plate-25.png` 可选作封面 |

## 2. 核心知识：为什么第一次没声音（最重要的一课）

**`wx.createInnerAudioContext().src` 的硬限制**（微信官方文档 + 社区实践双重确认）：

1. **不支持相对路径**（`../xx.mp3`、`./xx.mp3` 一律失败）
2. **访问不到代码包外的文件**（小程序只能读代码包内资源和 wx.env 沙箱文件）
3. 支持的形式：包内**绝对路径**（`/assets/audio/xx.mp3`）、网络 URL、云文件 ID、临时/用户文件路径

因此「mp3 与 miniprogram/ 同级 + 相对寻址」在小程序端**天然不可行**，必须走
「同步进包 或 HTTP 服务」的桥接方案。这正是 [player.js](../miniprogram/utils/player.js)
里三级候选寻址存在的原因。

> 错误表现（用于辨认）：点了播放、UI 正常走秒，但完全没有声音——说明所有候选都失败，
> 已静默回退模拟走秒。此时看 Console 里 `[player]` 开头的日志，会打印每个失败候选和错误码。

## 3. 寻址方案（三级候选，按序回退）

定义在 `miniprogram/utils/player.js` 顶部 `ARUARIAN_SRC_CANDIDATES`：

| 优先级 | src | 前提 |
|---|---|---|
| 1 | `/assets/audio/aruarian-dance.mp3` | 运行过 `tools/sync-audio.bat`（**首选，日常用这个**） |
| 2 | `http://127.0.0.1:8787/Nujabes - Aruarian Dance.mp3` | 运行并保持 `tools/serve-audio.bat`；项目已设 `urlCheck:false` 不校验域名 |
| 3 | `../Nujabes - Aruarian Dance.mp3` | 留给支持包外读取的运行环境（真机/特殊容器） |

机制：`onError` 触发即切下一个候选并自动重播；全部失败置 `audioBroken=true`，
回退纯模拟走秒，Demo 不断链。Node 测试环境无 `wx` 对象，自动走模拟分支。

## 4. 文件改动清单

### 数据与逻辑（手写，4 个文件）
- `miniprogram/utils/records.js` — 追加第 25 张唱片 `{id:25, title:'Aruarian_Dance', audio:true, trackId:'aruarian'}`；`DEFAULT_SELECTION` 加 `RECORDS.length`（默认挂墙）
- `miniprogram/utils/player.js` — 歌单 index 0 插入 Aruarian_Dance（真实时长 4:10 / 250s，128kbps 实测）；真实音频层（懒创建 InnerAudioContext、音频时钟同步进度、seek/切歌/暂停/对端 applyRemote 全链路）；`playTrack(id, autoplay)` 新导出
- `miniprogram/pages/profile/profile.js` — `onToggleRecord` 对 `audio:true` 的唱片走「播放 + 确保挂墙」分支（不摘墙）
- `tools/gen-song-assets.js` — `TRACKS` 加 `{id:'aruarian', rec: RECORDS[RECORDS.length-1]}`

### 工具脚本（2 个新 bat，均纯 ASCII 编写）
- `tools/sync-audio.bat` — 同级 mp3 → `miniprogram/assets/audio/aruarian-dance.mp3`，路径按 `%~dp0..` 相对推导，**迁移安全**
- `tools/serve-audio.bat` — 工程根目录起 `python -m http.server 8787` 作兜底

### 生成素材（4 个，均由管线产出，勿手画）
- `miniprogram/assets/img/cover-25.webp`（唱片夹封面）
- `miniprogram/assets/img/room/rec-plate-25.webp`（房间墙板）
- `miniprogram/assets/img/song-sleeve-aruarian.webp`（歌曲页封套）
- `miniprogram/assets/img/pc/pc-plate-25.png`（明信片层）

### 配套
- `.gitignore` — 忽略 `miniprogram/assets/audio/`（4MB 二进制是同步产物，勿入库）
- 测试更新：`tools/test-player.js` / `test-room-player-sync.js` / `test-sofa-sit.js`（歌单 4 首、默认 7 张墙、首曲断言）

## 5. 复现步骤（新机器 / 迁移后一次过）

按顺序执行（工程根目录下）：

```bat
rem 0. 前置：音源 mp3 必须与 miniprogram/ 同级（仓库自带，确认存在即可）
dir "Nujabes - Aruarian Dance.mp3"

rem 1. 安装生成器依赖（tools/ 下首次需要）
cd tools && npm install && cd ..

rem 2. 同步真实音频进代码包（必做，否则第一候选失效）
tools\sync-audio.bat

rem 3. 重新生成全部派生素材（covers 会自动多出 25；plates/sleeves/pc 同理）
cd tools
node gen-record-covers.js
node gen-song-assets.js
node gen-room-master.js
node gen-postcard-layers.js
cd ..

rem 4. ⚠️ 还原生成器漂移：gen-room-master 会重写出与手工微调过的
rem    room-scene-layout.js / room-master-geometry.json，必须 checkout 掉
git checkout -- miniprogram/utils/room-scene-layout.js visual-validation/rendered/room-master-geometry.json

rem 5. 全量回归（应全绿，共 219 项断言）
cd tools
node test-player.js && node test-room-player-sync.js && node test-sofa-sit.js
node test-sync.js && node test-room-map.js && node test-avatar.js && node test-profile-avatar.js
cd ..

rem 6. 微信开发者工具打开工程 → 编译 → 点 Aruarian_Dance 或 miniplayer 播放键
rem    （新增 audio 文件若没热加载，按 Ctrl+B 手动编译）
```

期望：点击后约 1s 内出声；Console 无 `[player]` 红色报错。

## 6. 踩坑记录（逐条都是血泪）

1. **InnerAudioContext 不吃相对路径 / 包外文件** → 见 §2，本次无声的直接原因。
2. **bat 必须纯 ASCII**：UTF-8（无 BOM）写中文注释会被 cmd 按 GBK 解析，逐行报
   「'xxx' 不是内部或外部命令」。所有入库 bat 只用英文注释（sync-audio.bat / serve-audio.bat）。
3. **生成器会漂移**：`gen-room-master.js` 每次全量重写 `room-scene-layout.js`，与仓库里
   手工微调过的版本冲突。**跑完必须 `git checkout` 还原**（§4 步骤 4），否则房间交互几何回归。
4. **真实 mp3 时长要实测**：`Nujabes - Aruarian Dance.mp3` 是 128kbps/48kHz CBR、无 Xing 头，
   按 `文件大小×8/码率` 估算 ≈ 250.3s，歌单 duration 填 250（4:10）。换音源时重新实测，
   进度条/歌词联动依赖这个值。
5. **点击播放心智**：profile 页普通唱片点击 = 切换挂墙选中态；Aruarian 这类 `audio:true`
   唱片点击 = 播放 + 确保挂墙（早期版本会把默认挂墙的它点掉，已修）。
6. **开发者工具自动化需要「服务端口」**：设置 → 安全设置 → 服务端口。关掉时
   `cli.bat auto/open` 一律报「工具的服务端口已关闭」，miniprogram-automator 连不上。
7. **歌单顺序是契约**：PLAYLIST[0] 固定为 Aruarian_Dance（新用户首曲），后面才是
   晴天/花海/夜曲。任何新增曲目只能往**尾部**加，否则房间同步测试的对端 index 语义全变。

## 7. 后续迁移到 Web（Vercel）时的对应关系

小程序 → Web 后，本篇的约束大部分**自然消失**，但概念要平移：

| 小程序端 | Vercel/Web 端 | 注意 |
|---|---|---|
| `InnerAudioContext` + 三级候选寻址 | 单个 `<audio>` / `Audio()`，src 用相对路径直接引用 `public/` 下文件 | Web 没有「包外不可读」问题，把 mp3 放 `public/audio/aruarian-dance.mp3` 即可；**可删掉全部候选回退逻辑** |
| `sync-audio.bat` 同步进包 | 不需要：构建时 mp3 随仓库进 `public/` | 若坚持音源只在仓库根目录，则在构建脚本里 copy 一步 |
| `wx.getStorageSync('roomie_records')` | `localStorage`（key 可沿用 `roomie_records`） | 默认值逻辑原样照搬 readSelection() |
| `utils/player.js` 单例状态机 | 可几乎原样搬成 TS 模块（去掉 wx 分支、定时器换真实 audio 事件） | `applyRemote` 同步协议（2.5s 容差/last-write-wins）保留 |
| 唱片墙/房间场景（WXML 组件） | React 组件化，CSS 照搬（WXSS≈CSS） | 封面/墙板等 webp 素材直接进 `public/assets/img/` |
| `tools/*.js` 素材生成管线 | 原样保留（Node + sharp 与平台无关） | 生成目标目录改到 `public/` |
| 测试（Node 直跑 player/records） | 原样保留，jest/node 皆可 | 这是迁移时最不容易坏的一层 |

**迁移建议顺序**：① utils 层（player/records/room-map 等纯逻辑）→ ② 组件与页面 →
③ 素材管线改输出目录 → ④ 部署配置（vercel.json / 框架选型）。每步跑 §5 的测试护体。
