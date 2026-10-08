# Roomie Web Demo (preview-app)

Roomie「深夜放映室」的 Web 运行时基座（Phase 2）：Vite + 原生 HTML/CSS/JS（无框架），DOM 版 room-scene 渲染器 + 可寻路/可交互的房间页与首页，状态经由 localStorage（wx 语义适配层）持久化。

**注意**：`legacy-pages/`、`legacy-assets/`、`shots/`、`shots-real/` 是 Phase 4 之前的静态复刻归档，仅供结构/文案参考，不进构建、不作为视觉基准。规则：**一切场景图像必须来自 `/assets/img/room/` 的 Master 资产**（L0–L7 灯光层 + 家具 overlay + 角色 + 唱片板材），由 `scripts/sync-assets.mjs` 从 `miniprogram/assets` 同步到 `public/assets`。

## 开发

```bash
npm install
npm run dev       # 自动先跑 sync-assets + sync-shared
npm run build     # 同上，产物在 dist/
npm run preview   # 本地预览构建产物
npm test          # shared 同步漂移检查 + player + room-map 断言
npm run sync:shared  # 手动重新同步 shared/state 移植文件
```

## 单一数据源与同步机制

`miniprogram/utils/` 是以下模块的唯一真源（其中 `room-scene-layout.js` 本身由 `tools/gen-room-master.js` 生成，两侧都禁止手改）：

| 真源 (CJS) | Web 拷贝 (ESM) | 同步方式 |
|---|---|---|
| `utils/room-scene-layout.js` | `src/shared/room-scene-layout.js` | `scripts/sync-shared.mjs` 机械转换 |
| `utils/room-map.js` | `src/shared/room-map.js` | 同上（转换时移除 legacy `room-layout` require 与默认实例，仅保留 `createMap(geometry, layout)` 工厂路径） |
| `utils/room-hit.js` | `src/shared/room-hit.js` | 同上 |
| `utils/player.js` | `src/state/player.js` | 同上（web 无额外改动，机械转换成立） |
| `utils/records.js` | `src/state/records.js` | 同上（`readSelection` 保持注入式 getter） |

- 生成文件头部带 `GENERATED … do not hand-edit` 横幅；转换为确定性锚点替换，上游结构变化会直接报错（强制人工复审），不会静默漂移。
- **一致性验证**：`npm test` 首先运行 `node scripts/sync-shared.mjs --check`（内存重生成 + 与提交文件比对，漂移即非零退出），再跑行为断言。
- **手动移植**（web 特有逻辑，不走 sync-shared）：`src/state/room.js`（localStorage 适配 + pub/sub）、`src/state/friends.js`（邀请流状态）、`src/router/`、`src/adapters/` 全部。

## 结构速览

- `src/router/` — hash 路由（静态部署友好），支持 `#/duo?peer=KIKI` 参数
- `src/state/` — player（mock 状态机）、room（roomie_room 存储 + pub/sub）、records、friends
- `src/shared/` — 与小程序共享精神的纯逻辑：room-scene-layout（生成产物，勿手改）、room-map（A* 寻路）、room-hit（命中检测）
- `src/components/room-scene/` — DOM Web Renderer（图层栈/地板 tint/角色景深/热点命中）
- `src/adapters/` — wx API 的 Web 适配：storage / navigation / platform(toast/modal/actionSheet) / socket(simPeer 默认) / audio(no-op seam) / canvas
- `src/pages/` — home、room 为功能页；friends/duo/architect/song/profile/postcard 为路由 stub

## 音频

全项目无音频资产，Player 为 mock 定时器状态机（与小程序一致）。真实音频请经 `src/adapters/audio.js` 的 driver 接口接入，不接任何版权音源。
