# Roomie Web Demo — 深夜放映室

Roomie 是一个"深夜私人放映室"社交产品：你有自己的一间等距 2.5D 小屋——2700K 暖光、黑胶唱机、唱片墙、放映机——朋友在隔壁各自的房间里听歌。这是 Roomie 微信小程序的 **Web Demo**（Vite + 原生 HTML/CSS/JS，无框架），与小程序共享同一套场景资产、灯光公式、寻路/命中逻辑与播放器状态机。

## 运行

```bash
npm install
npm run preview   # 生产构建 + 本地预览（推荐评审路径）
# 或开发模式：npm run dev
```

打开终端提示的地址（默认 `http://localhost:4173/`）即可。桌面浏览器会呈现居中的 390×844 手机壳视口；手机或移动模拟器下全屏铺满。无需账号、无需后端、无需任何配置。

## 推荐体验路径

1. **首页**（`#/home`）— 房间 hero、今晚任务、mini-player，点「进入放映室」
2. **房间**（`#/room`）— 点地板移动 MOMO（A* 寻路），点落地灯/放映机/唱机/沙发/吉他互动，KIKI 在房间里游走
3. **好友**（`#/friends`）— 每位好友的 live 小房间 vignette，邀请 NANA/ABO（模拟接受）→ 进入双人房
4. **双人同频**（`#/duo?peer=KIKI`）— 两个人在同一房间听同一首歌，对端会游走、甚至替你换唱片（模拟对端）
5. **建筑师**（`#/architect`，tabbar ＋）— 换家具/地板/色温，实时预览，保存后全应用生效（localStorage 持久化，刷新不丢）
6. **明信片**（`#/postcard`，房间页 ↗ 进入）— 把今晚的房间实时合成为一张 PNG 明信片，可下载
7. 辅助页：**歌曲**（`#/song`，mini-player 点击进入，歌词/评论）、**我的**（`#/profile`，形象定制 + 唱片墙 24 选 12）

## 演示性质说明

- **无后端、无真实音频**：播放器是 mock 定时器状态机（与小程序一致，规避版权音源）；双人同步默认走 simPeer 模拟对端（可选 WebSocket 模式连 `tools/sync-server.js`，默认关闭）。
- **状态全部在浏览器本地**（localStorage）：房间布置 `roomie_room`、唱片墙 `roomie_records`、头像/服装、未读角标。清掉站点数据即恢复出厂。
- **场景图像**全部来自 Room Master 资产管线（L0–L7 灯光层 + 家具 overlay + 角色精灵），运行时由 DOM 渲染器实时合成，非截图贴图。

## 技术要点

- `src/components/room-scene/` — DOM 渲染器：图层栈 mix-blend-mode、地板 tint clip-path、角色景深/脚底锚定、热点命中（z 序 hitArea 管道）
- `src/shared/` — 由 `scripts/sync-shared.mjs` 从 `miniprogram/utils/` 机械同步（`npm test` 含漂移检查，不一致即失败）
- `src/state/` — Player 单例 / room store（pub/sub）/ records / friends
- `src/adapters/` — wx API 的 Web 适配（storage/navigation/platform/socket/canvas/avatar）
- `legacy-pages/`、`legacy-assets/`、`shots/` — Phase 4 之前的静态复刻归档，仅供历史参考，不进构建

## 测试

```bash
npm test    # shared 漂移检查 + player 25 断言 + room-map 39 断言
```
