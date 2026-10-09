# Roomie 单一数据源与机械同步

## 问题

Web Demo（preview-app/）与小程序（miniprogram/）是两个独立运行时。核心逻辑
（场景数据/寻路/命中/播放器/唱片库）必须两侧一致，但不能共享运行时代码文件
（小程序 CJS + wx 环境 vs Web ESM + 浏览器）。

## 方案：真源在小程序，Web 端机械转换

**`miniprogram/utils/` 是唯一真源。** 其中 `room-scene-layout.js` 本身由
`tools/gen-room-master.js` 生成——任何一侧都禁止手改。

### 同步的 5 个文件

| 真源 (CJS) | Web 拷贝 (ESM) | 转换要点 |
|---|---|---|
| `utils/room-scene-layout.js` | `src/shared/room-scene-layout.js` | `module.exports` → `export default` |
| `utils/room-map.js` | `src/shared/room-map.js` | 移除 legacy `room-layout` require 与默认实例，仅保留 `createMap(geometry, layout)` 工厂 |
| `utils/room-hit.js` | `src/shared/room-hit.js` | 具名导出 |
| `utils/player.js` | `src/state/player.js` | 具名 + default 导出 |
| `utils/records.js` | `src/state/records.js` | 具名 + default 导出（readSelection 保持注入式 getter） |

### 工具：`preview-app/scripts/sync-shared.mjs`

- 确定性锚点替换（`mustReplace`）：锚点缺失（上游结构变了）直接抛错，强制人工
  复审，绝不静默漂移
- 生成文件头部带 `GENERATED from miniprogram/utils/<name> … do not hand-edit` 横幅
- `npm run sync:shared` 手动重生成；`predev`/`prebuild` 自动执行（与 sync-assets 一起）
- `npm test` 首先运行 `sync-shared.mjs --check`：内存重生成 + 与提交文件比对，
  漂移即非零退出（CI 式卡口），然后才跑 player/room-map 行为断言

### 手动移植（Web 特有，不走 sync-shared）

- `src/state/room.js` —— roomie_room store：localStorage 适配 + pub/sub（小程序
  里是 `app.globalData` + `wx.setStorageSync`，形状不同，无法机械转换）
- `src/state/friends.js` —— 好友数据 + 邀请流状态（Web 端把小程序页面内嵌数据
  提升为共享模块）
- `src/router/`、`src/adapters/` 全部 —— wx API 的 Web 适配层

### 资产同步

`scripts/sync-assets.mjs`：`miniprogram/assets` → `preview-app/public/assets`
（clean copy，幂等，predev/prebuild 自动执行）。场景图像一律经 `/assets/...`
URL 空间引用 Master 资产。

## 为什么不直接共享目录 / symlink / npm workspace

小程序构建对文件位置与模块化有约束；Web 端需要 ESM。机械转换 + 漂移检查用
最小的工具成本换取"两侧永远不会静默不一致"的保证。
