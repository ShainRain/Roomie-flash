# Roomie 状态架构

## 存储键（localStorage / wx storage，schema 两侧一致）

| Key | 结构 | 读写方 |
|---|---|---|
| `roomie_room` | `{floor: 'blue-gray'\|'walnut'\|'slate', lightTemp: 2700–6000, lightBright: 0–100, furniture: [id]}` | Architect 写；Home/Room/Duo/Profile/Postcard 读 |
| `roomie_records` | 唱片 id 数组（1–24，最多 12），默认 `[1,2,3,5,8,19]` | Profile 写；Room/Home/Postcard 读 |
| `roomie_unread` | 数字角标 | app 种子（mock 2）；tabbar 读 |
| `roomie_avatar` / `roomie_outfit` | `{path, name, size, at}`（≤2MB） | Profile 写；Profile/Room/Duo 读 |

## Player（唯一播放器状态机）

真源为 `miniprogram/utils/player.js`；**Web 端 `src/state/player.js` 是 API 完全
一致的手动移植**（设备层不同，状态机语义相同）。单例 + pub/sub：

- **Web 歌单**（`src/data/audio-manifest.js`）：3 首器乐曲目——`aruarian`
  （唯一真实音频，HTMLAudioElement 经 `adapters/audio.js` 播放）+ `bluehour` /
  `mistwindow`（占位 mock 定时器，audioAvailable=false 如实标注）
- 真实音频曲目：进度以音频时钟为准（timeupdate 写回）、播完 onEnded 切歌、
  加载失败回退 mock 走秒（Demo 不断链）
- API：`subscribe / toggle / play / next / prev / seek / switchTo / playTrack /
  applyRemote / snapshot` + `PLAYLIST` 导出（两侧一致）
- `applyRemote`（对端播放状态）：last-write-wins；进度误差 ≤2.5s 不校正；
  playing 时按 `sentAt` 补偿网络延迟；source 标记防回声
- **歌单顺序是契约**：新曲目只能往尾部追加（房间同步 index 语义）
- 器乐曲目无版权歌词：lyrics 字段为结构性段落标签（Intro/Theme/Outro 或
  「纯音乐 · …」描述行）

任何页面只许 subscribe / 读 snapshot / dispatch / unmount 时退订。
禁止第二状态机、第二计时器（工程上有 grep 级检查）。
许可核查见 [../audio/AUDIO-CATALOG.md](../audio/AUDIO-CATALOG.md)（当前仅 1 首
真实音频，licenseStatus: unverified）。

## roomie_room 编辑闭环（saved ↔ draft）

```
savedRoomState (roomie_room)
     │  进入 Architect：初始化 draft
     ▼
draftRoomState（页面作用域副本）
     │  编辑家具/地板/色温/亮度 → 实时驱动预览（RoomScene preview）
     │  保存 → saveRoom（schema 校验式 normalize）→ 写存储 + pub/sub 广播
     ▼
savedRoomState ←—— Home/Room/Duo/Profile/Postcard 读取（订阅或重挂载即刷新）
```

放弃 = 离开页面即丢弃 draft（小程序无退出确认/草稿持久化，如实移植）。
脏检查：按钮在「保存」（绿主 CTA）与「已保存」（绿软态）间切换。

## 各页面消费方式

| 页面 | roomie_room | roomie_records | Player | 其他 |
|---|---|---|---|---|
| Home | hero 场景 | 唱片槽位 | mini-player + hero 正在播徽标 | friends 条带 |
| Room | 场景 + 碰撞联动 | 唱片槽位 | dock mini-player + 唱机/唱片墙动作链 | simPeer KIKI |
| Duo | 共享房间（本地 room，只读） | 唱片槽位 | 共享播放器（对端 applyRemote） | socket 会话 |
| Architect | draft ↔ save（唯一写方） | 预览槽位 | 不订阅（预览为固定演示值） | — |
| Song | — | — | 全部 UI 由 snapshot 驱动 | 评论 mock |
| Profile | hero + 房间档案行 | **唯一写方**（24 选 12） | — | avatar/outfit 槽位 |
| Postcard | 地板/色温/家具 | 槽位板材 + 色块（≤6） | — | Canvas 合成 |

## 好友状态（`src/state/friends.js` / 小程序 pages 内嵌）

KIKI/NANA/ABO 在线 + RITA/TAO 离线（静态数据）；每位在线好友带 roomie_room
兼容的 `room` 与 vignette `variant`（色相/明度/角色变体）。邀请流状态
（inviting + 1.5s 模拟接受）为模块级 pub/sub。

## 形象槽位（avatar/outfit）

- 小程序：`utils/avatar.js` —— chooseMedia/chooseMessageFile → USER_DATA_PATH 落盘
- Web：`src/adapters/avatar.js` —— `<input type=file>` → dataURL → localStorage
  （同 key、同 2MB 上限、同自愈读取；outfit 替换房间/双人页 MOMO 精灵）
