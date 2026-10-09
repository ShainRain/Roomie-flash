# Roomie 架构总览

Roomie「深夜放映室」——以音乐和电影为媒介的"同频陪伴"轻社交产品。每个人都有
一间可 DIY 的等距 2.5D 放映室；邀请好友不是发消息，而是"来我家坐坐"。

## 两个运行时目标

| 目标 | 目录 | 技术 | 入口文档 |
|---|---|---|---|
| 微信小程序（主产品） | `miniprogram/` | 小程序原生框架（Page/Component/WXML/WXSS） | `miniprogram/README.md` |
| Web Demo（评审演示） | `preview-app/` | Vite + 原生 ESM HTML/CSS/JS，无框架，唯一依赖 vite | `preview-app/README.md` |

**关键事实：两个运行时不共享运行时代码文件。** 共享的是「源码逻辑经机械同步」：
`miniprogram/utils/` 的 5 个纯 JS 模块由 `preview-app/scripts/sync-shared.mjs`
确定性转换为 ESM 拷入 Web 端（见 [ROOMIE-SOURCE-OF-TRUTH.md](ROOMIE-SOURCE-OF-TRUTH.md)）。

## 技术地图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Roomie                                    │
├──────────────────────────────┬──────────────────────────────────┤
│  WeChat Mini Program         │  Web Demo (preview-app/)         │
│  miniprogram/                │  Vite + vanilla ESM              │
│                              │                                  │
│  pages/ (10 页)              │  src/pages/ (8 页, hash router)  │
│  components/                 │  src/components/                 │
│    room-scene (WXML 渲染)    │    room-scene (DOM 渲染器)        │
│    mini-player / header      │    player / tabbar / header      │
│  custom-tab-bar/             │                                  │
│  utils/ ◄──── 单一数据源      │  src/shared/ + src/state/ ◄── sync-shared.mjs 机械同步
│    room-scene-layout.js      │    room-scene-layout / room-map  │
│    room-map / room-hit       │    room-hit / player / records   │
│    player / records          │                                  │
│    room-sync (wx.connectSocket│  src/adapters/                   │
│    → tools/sync-server.js)   │    storage → localStorage        │
│                              │    navigation → hash router      │
│                              │    platform → toast/modal/sheet  │
│                              │    socket → WebSocket / simPeer  │
│                              │    avatar → dataURL+localStorage │
│                              │    audio → no-op seam            │
│                              │    canvas → toBlob 下载           │
│  app.wxss 设计令牌            │  src/styles/tokens.css (rpx→px)  │
│  assets/img/ (Master 资产) ──┼─► public/assets/ (sync-assets.mjs)│
└──────────────────────────────┴──────────────────────────────────┘
        ▲ tools/：资产生成管线（gen-room-master.js 等）
        ▲ reference-assets/ + visual-validation/：视觉回归基准与验收报告
```

## 共享逻辑（单一数据源，机械同步）

`miniprogram/utils/` 是真源；Web 端拷贝带 GENERATED 横幅，`npm test` 先做漂移检查：

- `room-scene-layout.js` — Room Master 场景数据（几何/灯光层/家具/唱片槽位；本身由 `tools/gen-room-master.js` 生成）
- `room-map.js` — A* 寻路 / 碰撞 / 景深（Web 端仅保留 `createMap(geometry, layout)` 工厂路径）
- `room-hit.js` — 家具热点命中检测

### 手动移植（API 契约一致，内容按平台分叉）

- `state/player.js` — 全局播放器状态机：小程序真源含 wx 真实音频层，Web 为
  API 完全一致的手动移植（设备层 = `adapters/audio.js` HTMLAudioElement，
  歌单 = `data/audio-manifest.js`：1 首真实音频 + 占位 mock 器乐曲目）
- `state/records.js` — 唱片库：Web 手动移植（24 张器乐曲名 + #25 Aruarian_Dance）

## Web 适配层（`preview-app/src/adapters/`）

wx API → Web 的一对一适配，语义对齐：storage（localStorage，缺失 key 返回 `''`）、
navigation（hash 路由）、platform（showToast/showModal/showActionSheet）、
socket（默认 simPeer 模拟对端，可选 WebSocket）、avatar（dataURL + localStorage）、
audio（HTMLAudioElement 驱动，Player 设备层）、canvas（toBlob → 下载）。

## Web 状态层（`preview-app/src/state/`）

`player.js`/`records.js`/`room.js`/`friends.js` 均为手动移植（见上）；
`data/audio-manifest.js` 为 Web 独有音轨清单。

## 构建与验证

- Web：`npm run dev / build / preview`（predev/prebuild 自动 sync-assets + sync-shared）
- 测试：`npm test` = 漂移检查 + player 25 断言 + room-map 39 断言（纯 Node，无框架）
- 资产管线：`tools/gen-*.js`（sharp 程序化生成，单一真源可复现）
- 视觉基准：`reference-assets/ui-reference/*.png`；验收报告在 `visual-validation/`

## 详索引

- 平台边界：[PLATFORM-BOUNDARIES.md](PLATFORM-BOUNDARIES.md)
- 场景系统：[ROOMIE-ROOM-SCENE.md](ROOMIE-ROOM-SCENE.md)
- 状态与持久化：[ROOMIE-STATE.md](ROOMIE-STATE.md)
- 同步协议：[ROOMIE-SYNC.md](ROOMIE-SYNC.md)
- 同步机制：[ROOMIE-SOURCE-OF-TRUTH.md](ROOMIE-SOURCE-OF-TRUTH.md)
- 音频目录与许可核查：[../audio/AUDIO-CATALOG.md](../audio/AUDIO-CATALOG.md)
