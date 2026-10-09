# Roomie 房间同步协议（room-sync）

> **明确声明**：Web Demo 默认 **simPeer 模拟对端**（零服务器依赖）。真实
> WebSocket 是适配层接缝 / 可选模式（`mode: 'websocket'` 连 `ws://127.0.0.1:8765`
> 的 `tools/sync-server.js` 中继），**不是生产实时通信**。小程序侧由
> `wx.connectSocket` 连同一中继。

## 消息协议（JSON，经 WebSocket 中继广播）

| type | 载荷 | 方向 | 说明 |
|---|---|---|---|
| join | `{room, name}` | 客户端→中继 | 进房；中继回 `joined`（含 members + 缓存的最近一次 player 状态，`from:'__cache'`） |
| move | `{left, top, direction, walking}` | 双向 | 角色位置；150ms 节流（pendingMove 补发） |
| state | `{key, value}` 或 `{furnitureId, furnitureActive}` | 双向 | 房间/家具状态联动（"KIKI 打开了放映机"） |
| player | `{index, position, playing, sentAt}` | 双向 | 播放器同步（见下） |
| action | `{label}` | 双向 | 互动气泡（"MOMO 弹了一段吉他"） |
| peer-join / peer-leave | `{from}` | 中继→客户端 | 进出通知 |

## Player 同步语义（`applyRemote`，last-write-wins）

- 进度误差 **≤2.5s 不校正**（防抖动）；`playing` 时按 `sentAt` 补偿网络延迟
- `from: '__cache'` 的中继补发可能是自己上一次会话的陈旧进度——只采纳曲目与播放态，不采纳进度
- 本地收到 remote 应用后**不回播**（source 标记防回声）；本地操作（切歌/播放暂停/seek 跳变 >3s）即时上报，另加 5s 心跳（仅在线时）

## simPeer（默认）

连接失败/未连接时自动降级为模拟对端：

- 每 4s 在当前位置附近游走（`onPeerMove`，页面对连接状态无感知）
- duo 页可选 `simPlayer` 活动：对端"放上唱片 / 换唱片"——发协议形状的 player
  消息，本地经 `applyRemote` 应用（全局 Player 单例随之切换，各页一致）

## 连接生命周期

单实例 + connecting 守卫；`join()` 幂等（已连线只更新 handlers）；旧 socket 的
事件不再改变状态（`sock !== socket` 守卫）；断线自动 `degrade()` → simPeer 兜底。
