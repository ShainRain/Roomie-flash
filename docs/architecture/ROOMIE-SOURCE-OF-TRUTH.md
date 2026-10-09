# Roomie 单一数据源与机械同步

## 问题

Web Demo（preview-app/）与小程序（miniprogram/）是两个独立运行时。核心逻辑
（场景数据/寻路/命中）必须两侧一致，但不能共享运行时代码文件（小程序 CJS +
wx 环境 vs Web ESM + 浏览器）。

## 方案：真源在小程序，Web 端机械转换

**`miniprogram/utils/` 是唯一真源。** 其中 `room-scene-layout.js` 本身由
`tools/gen-room-master.js` 生成——任何一侧都禁止手改。

### 机械同步的 3 个文件（sync-shared.mjs）

| 真源 (CJS) | Web 拷贝 (ESM) | 转换要点 |
|---|---|---|
| `utils/room-scene-layout.js` | `src/shared/room-scene-layout.js` | `module.exports` → `export default` |
| `utils/room-map.js` | `src/shared/room-map.js` | 移除 legacy `room-layout` require 与默认实例，仅保留 `createMap(geometry, layout)` 工厂 |
| `utils/room-hit.js` | `src/shared/room-hit.js` | 具名导出 |

### 工具：`preview-app/scripts/sync-shared.mjs`

- 确定性锚点替换（`mustReplace`）：锚点缺失（上游结构变了）直接抛错，强制人工
  复审，绝不静默漂移
- 生成文件头部带 `GENERATED from miniprogram/utils/<name> … do not hand-edit` 横幅
- `npm run sync:shared` 手动重生成；`predev`/`prebuild` 自动执行（与 sync-assets 一起）
- `npm test` 首先运行 `sync-shared.mjs --check`：内存重生成 + 与提交文件比对，
  漂移即非零退出（CI 式卡口），然后才跑 player/room-map 行为断言

## 手动移植（Web 特有，**不走** sync-shared）

| Web 文件 | 性质 | 原因 |
|---|---|---|
| `src/state/player.js` | **API 完全一致的手动移植**（自合法器乐迁移起） | 小程序 `utils/player.js`（e040ac2 起）含 `wx.createInnerAudioContext` 真实音频层与版权曲目歌词，无法机械转换进 Web。Web 版设备层 = `src/adapters/audio.js`（HTMLAudioElement），歌单 = `src/data/audio-manifest.js` |
| `src/state/records.js` | 手动移植（schema 一致，内容有意分叉） | Web 24 张唱片标题迁移为器乐/氛围元数据；第 25 张 Peaceful 为真实音频唱片（CC0 1.0） |
| `src/state/room.js` | 手动移植（roomie_room store + pub/sub） | 小程序侧是 `app.globalData` + `wx.setStorageSync`，形状不同 |
| `src/state/friends.js` | 手动移植 | Web 端把小程序页面内嵌数据提升为共享模块 |
| `src/data/audio-manifest.js` | **Web 独有** | 音轨清单（真实 src / 占位 mock / licenseStatus / attribution） |
| `src/router/`、`src/adapters/` 全部 | Web 独有 | wx API 的 Web 适配层 |

**Player 公共 API 契约**（两侧保持一致，grep 可证）：
`subscribe / toggle / play / next / prev / seek / switchTo / playTrack / applyRemote / snapshot` + `PLAYLIST` 导出。
歌单顺序是契约：新曲目只能往尾部追加（房间同步 index 语义）。

### 资产同步

`scripts/sync-assets.mjs`：`miniprogram/assets` → `preview-app/public/assets`
（clean copy，幂等，predev/prebuild 自动执行）。真实音频例外：
`preview-app/public/audio/` 是仓库内唯一存放点，小程序经 `tools/sync-audio.bat`
复制进包（产物不入库）。

## 为什么不直接共享目录 / symlink / npm workspace

小程序构建对文件位置与模块化有约束；Web 端需要 ESM。机械转换 + 漂移检查 +
明确的手动移植清单，用最小工具成本换取"两侧永远不会静默不一致"的保证。

相关：[PLATFORM-BOUNDARIES.md](PLATFORM-BOUNDARIES.md)
