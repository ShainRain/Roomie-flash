# Roomie 平台边界（Platform Boundaries）

Roomie 有两个运行时。**"共享逻辑" ≠ "共享运行时文件"**——两侧各自编译、各自运行，
通过机械同步（`sync-shared.mjs` / `sync-assets.mjs`）保持核心逻辑一致。平台适配层
的差异是预期行为，不是缺陷。

## Mini Program（`miniprogram/`）

- 技术：小程序原生框架（WXML / WXSS / JS，CommonJS `require`），wx API
- 音频：`wx.createInnerAudioContext` + 三级寻址候选（`/assets/audio/` 包内 →
  本地 HTTP → 相对路径，见 docs/audio/ROOMIE-REAL-AUDIO-PLAYBOOK.md）
- 存储：`wx.getStorageSync`；场景：WXML 组件渲染
- 资产：包内 `/assets/`（≤2MB 主包限制；真实 mp3 由 `tools/sync-audio.bat` 同步
  进包且不入库）
- 测试：`tools/test-*.js`（Node 直跑，wx 缺失时自动降级 mock）

## Web（`preview-app/`）

- 技术：Vite + 原生 ESM HTML/CSS/JS（无框架，唯一依赖 vite），浏览器 API
- 音频：**HTMLAudioElement**（`src/adapters/audio.js` 设备层）——Web 没有
  「包外不可读」限制，`public/audio/*.mp3` 直接经 `/audio/*.mp3` 引用，
  单一候选无回退链；加载失败回退 mock 走秒（Demo 不断链）
- 存储：localStorage（wx 语义适配，缺失 key 返回 `''`）
- 场景：DOM 渲染器（`src/components/room-scene/`）
- 部署：Vercel（root 必须保持 `preview-app/`），hash 路由静态友好
- 测试：`preview-app/tests/`（sync 漂移检查 + player + room-map）

## Shared Concepts（共享概念，各自实现）

| 概念 | 小程序侧 | Web 侧 | 一致性机制 |
|---|---|---|---|
| RoomScene 场景 | `components/room-scene`（WXML） | `components/room-scene`（DOM） | 同源数据（room-scene-layout），语义移植 |
| Player 播放器 | `utils/player.js`（真源，wx 音频层） | `state/player.js`（**手动移植**，HTMLAudioElement 设备层） | API 契约一致（subscribe/toggle/seek/applyRemote/…） |
| Room State（roomie_room） | `app.js` globalData + storage | `state/room.js`（store + pub/sub） | schema 一致 |
| Records 唱片库 | `utils/records.js`（真源） | `state/records.js`（**手动移植**，器乐曲名） | schema 一致，内容有意分叉（合法器乐迁移） |
| Sync 同步协议 | `utils/room-sync.js`（wx.connectSocket） | `adapters/socket.js`（WebSocket / simPeer 默认） | 消息协议一致（move/state/action/player/sentAt） |
| Design Tokens | `app.wxss`（rpx） | `styles/tokens.css`（--rpx 换算） | 同源令牌 |
| 寻路/命中/布局 | `utils/room-map/room-hit/room-scene-layout` | `src/shared/`（机械同步生成） | sync-shared.mjs + 漂移检查 |

## 音频迁移边界（本次变更的关键决策）

`miniprogram/utils/player.js`（e040ac2 起）含 wx 专用音频层与版权曲目歌词，
**不能**机械转换进 Web。因此：

- `src/state/player.js`、`src/state/records.js` 退出 sync-shared，成为**有文档
  的手动移植**（公共 API 不变；Web 歌单 = `src/data/audio-manifest.js`）
- 真实音频文件存放点：`preview-app/public/audio/`（3 首 CC0 1.0 器乐曲目）
  （小程序经 `tools/sync-audio.bat` 从该处复制进包）
- 同步的 3 个文件（room-scene-layout / room-map / room-hit）维持机械同步不变
