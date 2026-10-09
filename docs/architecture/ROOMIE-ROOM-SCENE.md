# Roomie 房间场景系统（Room Master Scene）

房间是所有页面的第一视觉主体。同一份数据与同一套规则在小程序（WXML 组件）和
Web Demo（DOM 渲染器）中各渲染一次，行为一致。

## 单一数据源：`utils/room-scene-layout.js`

由 `tools/gen-room-master.js` 生成（两侧均禁止手改；Web 端拷贝经
`scripts/sync-shared.mjs` 同步）。包含：

- `GEOMETRY`：画布 828×828，原点 (414,235)，SX=480/SY=250（等距投影参数），
  景深区间 depthTop 32–85
- `LAYERS`：L0–L7 灯光层路径
- `FURNITURE`：14 件家具元数据（见下）
- `FIXED_COLLIDERS`：固定碰撞体（茶几）
- `FIXTURE_OBJECTS`：唱片墙、地面唱片（墙上装置，非家具）
- `RECORD_SLOTS`：12 个唱片墙槽位（stage % 坐标）
- `PLATTER` / `WALL_NOW_PLAYING`：唱盘旋转点 / 墙上"正在播放"徽标位置
- `CHAR`：角色基准（baseHeight 128，spriteAspect 144:184）

## 图层栈与灯光公式

舞台为正方形（828px ↔ 100%，坐标一律用 stage %），自下而上：

| 层 | 资产 | 混合 | 不透明度 |
|---|---|---|---|
| L0 | room-base | 正常 | 1 |
| L1 | ambient-shadow | 正常 | 1 |
| L2 | cool-night-window | screen | `0.5 + 0.5t` |
| — | 地板 tint（clip-path 菱形） | 正常 | 0.45（FLOOR_COLORS） |
| L3 | warm-light-room | screen | `max(0, 1-t) × lampFactor` |
| L4 | shelf-edge-glow | screen | 0.85 |
| 槽位 | rec-plate-N（前 N 个槽位） | 正常 | 1 |
| — | 家具 + 角色 z 栈（见下） | 正常 | 1 |
| L5 | lamp-pool | screen | `lampOn ? 1 : 0` |
| L6 | warm-veil-char | screen | `max(0.08, (1-t)(0.35 + 0.65·lampFactor))` |
| L7 | projector-beam | screen | `projectorOn ? 1 : 0` |
| — | dim 调光层 | 正常 | `0.55 × (1 - lightBright/100)` |

其中 `t = clamp((lightTemp − 2700) / 3300)`（2700K 暖黄 ↔ 6000K 雪白），
`lampFactor = lampOn ? 1 : 0.25`。色温反向层 L2 与主暖层 L3 互补插值——这是
"色温滑杆"的视觉本质。灯光公式在两个运行时逐字相同。

## 家具元数据的三个域（严格分离，这是纪律）

每件家具声明：

- `bounds` / `asset` —— **视觉边界**：全画布 overlay 图，与灯光层同坐标系
- `hitArea` —— **交互命中**：矩形/多边形，只服务互动（点按 → furnituretap）
- `collision` —— **移动碰撞**：uv 参数化矩形，只服务寻路（A* 障碍）

hitArea 与 collision 完全分离：能点的未必挡路，挡路的未必能点。
`fixed: true`（茶几）不可在建筑师模式撤下；`hotspot` 提供热点图标/名称。

## 角色

- 脚底锚定：`translate(-50%, -100%)` 精确站在 (x, y)
- 景深：`depthFor(top)` → scale = 0.82 + t×0.23（t 为纵深归一化），z = round(top×10)
- 朝向：`facing < 0` 时 scaleX(-1) 翻转
- 帧：idle（呼吸）/ walk-a / walk-b（步态交替）/ sit，CSS keyframe 驱动
- 角色 z 与家具 z 同轴排序——走近茶几前面会挡住茶几，走到沙发后被沙发挡住（真实遮挡）

## 寻路与碰撞（`utils/room-map.js`）

- 可行走区 = 地板菱形（uv ∈ [0.06, 0.94]²），角色碰撞半径 RADIUS_UV=0.06
- 点按落点先 `clampToFloor` 拉回菱形，撞上家具则 `resolveTarget` 沿视线回退到最近可站立点
- A*：uv 空间 17×17 网格、8 方向、对角不过墙角；`smoothPath` 视线拉直
- DIY 联动：`setActiveFurniture(keys)` 撤下的家具不再挡路（固定件除外）
- Web 端只保留 `createMap(geometry, layout)` 工厂（legacy 默认实例已移除）

## 命中管道（`utils/room-hit.js`）

点按 → 归一化为 stage % → `hitTest` 按 z 降序查 hitArea（射线法多边形/矩形）→
命中报 `furnituretap`，未命中报 `stagetap`（交给寻路）。

## 各页面用法

| 页面 | mode | 说明 |
|---|---|---|
| home | preview | hero 裁切取景，点按进房间 |
| room | interactive | 全交互（寻路 + 7 条家具动作链 + 气泡 + 对端同步） |
| duo | duo | 同 interactive，双角色 |
| architect | preview | 实时绑定 draft（编辑即所见） |
| friends | preview | 每位好友一个 vignette（逐好友色相/明度变体 + 角色变体） |
| profile | preview | 我的房间 hero（当前 roomie_room） |
| postcard | — | 不走 DOM 渲染器：Canvas 2D 同规则离线合成（pc/ PNG 层） |

## 离线合成镜像

`tools/lib-scene-compose.js`（sharp）与运行时同规则：vignette、明信片 pc/ 层、
参考图都由它产出。浏览器 `mix-blend-mode: screen` 与 sharp 的 screen 合成略有
亮度差——以浏览器实测为验收基准（项目既有先例）。
