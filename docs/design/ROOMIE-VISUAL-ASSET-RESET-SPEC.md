# ROOMIE 视觉资产重置与空间视觉重构规范

> 文档类型：Visual Asset Reset / Visual Engineering Specification  
> 目标：停止“微调 CSS”式视觉迭代，重建 Roomie 的核心视觉资产与空间视觉系统，再将其稳定迁移到各页面。  
> 使用对象：Kimi Code / Codex / 具备浏览仓库、修改代码、生成截图能力的 Agent。  
> 基准：当前 Roomie 开发手册、微信小程序规格，以及当前实现截图。  
> 核心原则：**不要重新设计 Roomie 的功能；重置视觉资产、空间构图、材质、灯光和页面视觉层级。**

---

# 0. 执行摘要：为什么要重置

当前实现已经具备较完整的产品功能结构，但视觉结果没有达到目标。

当前问题不是“圆角不够好”“阴影不够细”“颜色再调一点”这种局部 CSS 问题，而是一个更底层的问题：

> **当前实现把 Roomie 做成了“深色游戏化 UI + 小型等距插画”，目标则应该是“有真实居住感的深夜音乐微型空间 + 轻量悬浮 UI”。**

因此禁止继续采用以下低效路线：

```text
当前页面
→ 不断增加阴影
→ 增加渐变
→ 增加装饰
→ 调整几个 padding
→ 再加卡片
→ 再加绿色
→ 继续截图
```

这会让页面越来越像 AI Dashboard / Mobile UI Kit，而不会真正接近目标视觉。

本次工作必须执行：

```text
暂停局部抛光
↓
重建核心 Room Master Scene
↓
重建室内美术资产
↓
重建材质 / 灯光 / 镜头
↓
重建空间图层与 z-index
↓
重建页面视觉层级
↓
以 Room Master Scene 为母版迁移到其它页面
↓
截图 + Visual Diff
↓
逐轮修正
```

---

# 1. 产品与视觉目标不得改变

## 1.1 产品定位

Roomie 是一间可 DIY 的虚拟放映室，让用户通过音乐、空间和角色动作，以低压力的方式邀请朋友一起听。

核心闭环保持不变：

```text
进房间
→ 一起听
→ 邀请好友
→ 双人同频
→ DIY 房间
→ 分享明信片
```

禁止因为视觉重置而：

- 删除现有页面
- 删除播放器状态机
- 删除 room-sync
- 删除 room-map
- 删除角色移动
- 删除家具碰撞
- 删除 DIY 持久化
- 删除唱片墙逻辑
- 删除 Canvas 明信片
- 更换产品定位
- 增加未经产品规格批准的新机制

---

# 2. 本次视觉重置的核心判断

## 2.1 当前问题的根因排序

### P0：核心美术资产错误

当前房间资产更像简化的等距游戏素材，而不是：

> 可居住的音乐工作室 + 小型唱片画廊 + 深夜私人空间。

必须重新建立高质量的房间资产。

### P0：构图错误

当前页面：

```text
UI 是主角
↓
房间只是插画
```

目标：

```text
房间是视觉主角
↓
UI 是悬浮的信息层
```

### P0：镜头错误

当前只是“isometric”。

目标必须是：

> **Isometric Close-up / 等距微距**

用户应该感觉自己就在房间门口或房间内部观察，而不是在看一个小游戏地图缩略图。

### P1：光照错误

当前灯光更像局部色块。

目标是形成真正的空间光照关系：

```text
暖灯 / 投影
↓
木材被照亮
↓
沙发受到暖色反射
↓
唱片产生局部高光
↓
角色出现暖色轮廓
↓
墙面产生柔和渐变阴影
```

### P1：材质错误

当前墙面、木头、黑胶、金属、织物的视觉质感过于接近。

必须建立材质差异。

### P1：空间密度错误

当前房间过空，家具与收藏品不足，生活感弱。

目标：丰富但不杂乱。

### P2：UI 模板感过强

目前绿色胶囊 + 米白卡片 + 深蓝背景已经形成明显的 UI Kit 感。

UI 需要继续统一，但不能继续靠“增加卡片”解决问题。

---

# 3. 视觉总原则：先建立世界，再放置 UI

Roomie 的视觉结构必须被理解为：

```text
ROOMIE
│
├── WORLD / 空间世界
│   ├── 夜景背景
│   ├── 房间墙体
│   ├── 地面
│   ├── 家具
│   ├── 唱片墙
│   ├── 乐器
│   ├── 植物
│   ├── 唱机
│   ├── 放映墙
│   ├── 灯具
│   ├── 角色
│   └── 光影
│
└── UI / 信息与交互
    ├── Header
    ├── Status
    ├── Cards
    ├── Player
    ├── CTA
    └── Tab Bar
```

原则：

> **UI 不负责制造房间的美感。房间本身必须先美。**

---

# 4. Room Master Scene：本次任务的最高优先级

## 4.1 目标

先不要继续全面优化 7 个页面。

第一阶段只建立一个真正高质量的：

> **ROOM MASTER SCENE**

它是整个 Roomie 的视觉母版。

必须能够单独拿出来，让人一眼感觉：

> “这是 Roomie。”

## 4.2 Master Scene 必须具备

### 建筑结构

- 左墙
- 右墙
- 地面
- 投影墙
- 窗口 / 夜景
- 墙角

### 主要视觉锚点

- 主唱片墙
- 唱机 / Hi-Fi 柜
- 放映墙
- 沙发

### 中型陈列

建议 3–5 个：

- 落地灯
- 吉他
- 音箱
- 小茶几
- 植物
- 小边柜
- 投影设备

### 小型生活痕迹

适量：

- 杂志
- 唱片
- 杯子
- 小装饰
- 线材
- 小台灯
- 音箱配件

### 角色

- MOMO
- KIKI

角色必须真正处于空间中，而不是贴纸。

---

# 5. 房间构图规范

## 5.1 镜头

必须采用：

> **等距微距 / Isometric Close-up**

不是：

- 远距离地图视角
- 小房间缩略图
- 普通正视图
- 传统手机游戏地图

## 5.2 房间视觉面积

房间是页面 Hero 的主体。

在 Room / Duo / Architect / Home 等相关页面中，房间必须成为最强视觉元素。

不要让大量空的深蓝区域包围一个很小的房间。

目标是：

```text
┌─────────────────────┐
│ Header / 少量状态    │
│                     │
│   ┌──────────────┐  │
│   │              │  │
│   │  ROOM MASTER │  │
│   │              │  │
│   └──────────────┘  │
│                     │
│      少量 UI        │
└─────────────────────┘
```

而不是：

```text
┌─────────────────────┐
│ Header              │
│                     │
│     小小房间         │
│                     │
│                     │
│ Player              │
│ Card                │
│ Button              │
│ Tab                 │
└─────────────────────┘
```

## 5.3 三角视觉结构

建议房间内部形成：

```text
唱片墙
   ↘
     角色 / 唱机
          ↙
      投影墙
```

使眼睛能够在房间内部自然移动。

---

# 6. 核心空间资产拆分

禁止将整个房间长期作为一个不可分离的大图，尤其当家具需要交互、移动、遮挡或 DIY 时。

推荐拆成：

```text
room/
├── room-base.webp
├── wall-left.webp
├── wall-right.webp
├── floor.webp
├── projection-wall.webp
├── window-night.webp
├── ambient-shadow.webp
├── warm-light-overlay.webp
└── projector-light.webp
```

家具：

```text
furniture/
├── sofa.webp
├── armchair.webp
├── coffee-table.webp
├── side-table.webp
├── turntable.webp
├── cabinet.webp
├── speaker.webp
├── floor-lamp.webp
├── table-lamp.webp
├── guitar.webp
├── plant.webp
├── bookshelf.webp
├── record-shelf.webp
└── projector.webp
```

收藏与环境：

```text
collection/
├── record-cover-01.webp
├── record-cover-02.webp
├── vinyl-01.webp
├── poster-01.webp
├── poster-02.webp
├── magazine.webp
└── small-object-*.webp
```

角色：

```text
characters/
├── momo-idle.webp
├── momo-walk-a.webp
├── momo-walk-b.webp
├── momo-sit.webp
├── kiki-idle.webp
├── kiki-walk-a.webp
├── kiki-walk-b.webp
└── kiki-sit.webp
```

---

# 7. 室内风格：不是“游戏房间”，而是“真实生活空间的微缩化”

目标风格：

> Vintage Hi-Fi listening room / 音乐收藏者的私人房间 / 深夜音乐工作室

视觉关键词：

- 胡桃木
- 米白墙面
- 深棕家具
- 炭黑音响
- 琥珀暖光
- 深蓝夜景
- 复古唱片
- 海报墙
- 植物
- 织物
- 金属
- 玻璃
- 微量杂乱
- 收藏痕迹

不要做成：

- 极简北欧客厅
- 普通游戏 UI 房间
- 卡通游乐场
- 商业家居展示厅
- “满屏家具图标”的装修软件

---

# 8. 家具层级：大锚点 + 中件 + 小噪点

严格采用三级层次：

## 一级：大锚点

每个主要画面最多 1 个最明显的大锚点，优先：

- 沙发
- 唱机柜
- 放映墙
- 唱片墙

## 二级：中型元素

3–5 个：

- 落地灯
- 吉他
- 音箱
- 植物
- 茶几
- 小边柜

## 三级：小噪点

若干，但必须克制：

- 杂志
- 杯子
- 小摆件
- 线材
- 小型唱片

原则：

> **“有人生活过”而不是“家具堆满了”。**

---

# 9. 唱片墙必须重做

唱片墙是 Roomie 的核心识别资产之一。

目标：

> 收藏家的兴趣墙，而不是装饰素材网格。

建议：

- 2–3 层胡桃木层板
- 封套与黑胶交替
- 海报与唱片混排
- 大小不同
- 材质不同
- 颜色存在分组
- 保留部分空隙

节奏：

```text
封套 — 黑胶 — 封套 — 黑胶
    海报
封套 — 封套 — 黑胶
```

不要：

```text
□ □ □ □
□ □ □ □
□ □ □ □
```

也不要过于凌乱。

必须同时满足：

> 收藏感 + 可读性 + 秩序

## 版权

禁止直接使用参考图中的：

- 海报原图
- 唱片封面
- 品牌 Logo
- 平台水印

用原创抽象封面、几何图形、虚构唱片或已授权素材替代。

---

# 10. 材质系统

每种材质必须有明确视觉差异。

## 墙面

- 哑光
- 低反射
- 柔和阴影
- 略微颗粒

## 胡桃木

- 木纹方向明确
- 边缘高光
- 暖色反射
- 不要纯色棕块

## 黑胶

- 深黑 / 深灰
- 同心纹理
- 环境高光
- 略带反射

## 金属

- 比木材冷
- 局部高光
- 细小反射

## 织物

- 柔和漫反射
- 低高光
- 微纹理

## 玻璃

- 透明 / 半透明
- 反射
- 轻高光

原则：

> **不要让所有物体看起来像同一种“扁平插画材质”。**

---

# 11. 灯光系统

这是视觉重置中的 P0 / P1 工作。

## 11.1 总体灯光关系

外部环境：冷

```text
深夜蓝 / 蓝灰 / 冷色
```

内部环境：暖

```text
2700K 左右
```

交互状态：绿色

```text
Roomie Green
```

## 11.2 主光

优先来自：

- 左上
- 放映墙
- 落地灯
- 台灯

## 11.3 投影光

必须形成明确的光束 / 屏幕色光。

## 11.4 环境光

房间不能只靠几个亮黄色区域表达灯光。

需要：

- 墙面受光
- 地面受光
- 家具受光
- 角色受光
- 阴影
- 局部反射

## 11.5 颜色温度

建筑师模式可以提供：

```text
2700K — 6000K
```

但视觉设计中：

- 2700K = 居住感 / 深夜 / 温暖
- 6000K = 建筑师模式的预览极端状态

不要把整个应用都默认做成 6000K 冷光。

---

# 12. 角色必须融入空间

MOMO：

- 橙色
- 圆润
- 温暖

KIKI：

- 黄色
- 与 MOMO 形成清晰区分

角色必须：

- 有脚底阴影
- 有统一光源方向
- 有空间遮挡
- 与地面接触
- 走到前景时略微变大
- 到家具后方时正确被遮挡

禁止：

```text
character.png
直接盖在 room.png 上
```

必须形成：

```text
Room
↓
Furniture back layer
↓
Character
↓
Furniture front layer
↓
UI
```

---

# 13. 空间 z-index / 深度系统

Room / Duo 必须继续使用统一 room-map。

逻辑上建议：

```text
Z0 背景天空
Z10 左右墙
Z20 后方家具
Z30 唱片墙 / 柜体
Z40 角色
Z50 前景家具
Z60 地面交互物
Z70 角色气泡
Z80 页面 HUD
Z90 Player / Bottom UI
```

实际数值可以根据代码体系调整，但原则不变：

> **深度必须稳定。**

角色不能突然浮在家具上面，也不能穿过墙面。

---

# 14. UI 视觉层：降低存在感，而不是消灭 UI

Roomie 依然需要 UI，但 UI 不应该压过房间。

## Header

保留：

- ROOMIE
- 深夜放映室 · ROOM ID
- LIVE
- 状态

但减少厚重卡片感。

## Status Pill

绿色胶囊用于：

- LIVE
- 在线
- 放映中
- 同步中

不要使用红色表达普通状态。

## Paper Card

米白 / 暖白。

要有轻微纸张感，但不要强烈拟物。

## CTA

继续使用绿色主按钮。

但不要每一个交互都使用绿色大胶囊。

绿色应该是“关键行动”的颜色。

---

# 15. 页面重构策略

## 15.1 Home

视觉任务：

> 首页第一眼必须是“今晚有人在房间里听歌”。

顺序：

```text
Header
↓
今晚状态
↓
巨大 Room Master Scene
↓
在线 roomie / 轻量状态
↓
放映任务
↓
Mini Player
↓
进入放映室
↓
Tab
```

禁止让任务卡 / Player / CTA 抢掉房间的第一视觉重心。

---

## 15.2 Friends

当前问题：小房间像游戏大厅，朋友列表像通讯录。

目标：

> **“夜里，每个朋友都住在自己的小房间里。”**

视觉重点：

```text
朋友房间群落
↓
在线状态
↓
朋友列表
```

微型房间必须使用与 Master Scene 同一套视觉资产，不重新画一套廉价缩略图。

在线朋友可以使用绿色状态。

离线朋友降低亮度。

---

## 15.3 Song

不要做成普通音乐播放器。

视觉概念：

> **“从 Roomie 的房间里取出一张唱片。”**

建议：

```text
唱片 / 封套
↓
歌曲信息
↓
进度
↓
播放控制
↓
歌词
↓
评论
```

唱片必须具备真实材质，而不是单纯放大圆形黑色图案。

可以引入：

- 唱机
- 木柜
- 灯光
- 微型房间环境

但不能导致控件难以使用。

---

## 15.4 Duo

这是陪伴感最强页面。

目标：

> **两个人真的在一个房间里一起听。**

不要：

```text
MOMO头像 + KIKI头像 + 95%
```

而要：

```text
MOMO
+
KIKI
↓
共享房间
↓
同步状态
↓
共享播放器
```

人物应该在房间的真实家具环境中互动。

---

## 15.5 Architect

目标：

> 室内设计师工作台，而不是后台管理页面。

上方：

> 大型 Room Master Preview

下方：

> 家具 / 地板 / 灯光

家具缩略图必须和真实房间中的家具是同一套资产。

例如：

```text
Architect 沙发
=
Room 里的沙发
```

不要存在：

> 房间是一个美术风格，家具面板是另一套 icon 风格。

选中家具时：

- 清晰但克制的绿色选中态
- 真实缩略图
- 不要把家具做成纯线性 icon

---

## 15.6 Profile / 我的放映室

不能做成普通 Dashboard。

定位：

> **“我的私人房间档案。”**

核心：

- MOMO
- 等级
- 建筑师徽章
- 唱片收藏
- 我的房间

唱片墙必须是主视觉之一。

---

## 15.7 Postcard

必须像真实的：

> **深夜寄出去的一张音乐房间明信片。**

保留：

- 米白纸张
- 房间照片 / 插画
- ROOM ID
- 邮票
- 唱片印章
- 手写感标语

推荐标语：

> 有音乐的房间，抵千万句寒暄

明信片不应该像普通截图卡片。

---

# 16. Mini Room 资产系统

Friends 页面可能需要多个朋友房间。

不要为每个人重新生成完全不同的房间系统。

应该：

```text
MASTER ROOM
↓
Variant A
Variant B
Variant C
```

通过少量资产替换体现个性：

- 唱片墙
- 地板
- 沙发
- 台灯
- 海报配色
- 植物
- 角色

保持整体 Roomie 世界一致。

---

# 17. 资产生产规则

## 17.1 文件格式

运行时优先：

- WebP
- JPG（Canvas / 分享路径中按现有规格使用）
- PNG（需要透明通道的对象）
- SVG（真正适合矢量 UI 时使用）

## 17.2 资产必须透明

角色、家具、装饰等需要独立定位的对象不得带白底。

## 17.3 尺寸

所有资产必须按照显示用途输出，不要将超大原图直接塞入小程序运行包。

## 17.4 命名

使用稳定命名：

```text
category-name-state-variant.ext
```

例如：

```text
sofa-main.webp
lamp-floor-warm.webp
momo-idle.webp
momo-walk-a.webp
record-cover-07.webp
```

---

# 18. Figma / Asset Source 规范

如果使用 Figma 作为设计源，应按以下层级组织：

```text
ROOMIE
├── 00 Design Tokens
├── 01 App Shell
├── 02 Room Master
├── 03 Furniture
├── 04 Characters
├── 05 Record Collection
├── 06 Lighting
├── 07 Home
├── 08 Friends
├── 09 Song
├── 10 Duo
├── 11 Architect
├── 12 Profile
└── 13 Postcard
```

每个家具必须有独立 Frame / Component。

Room Master 必须保留空间构图原始结构，方便导出不同页面尺寸。

---

# 19. 不允许继续使用的“视觉捷径”

禁止把以下做法当成主要解决方案：

1. 大量 `linear-gradient`
2. 大量 `box-shadow` 模拟质感
3. 用纯色矩形模拟木材
4. 用圆角矩形模拟复杂家具
5. 用 icon 代替真实家具
6. 用一张整体截图覆盖整个页面
7. 用背景图伪造可交互家具
8. 将所有家具画成同一种扁平材质
9. 用大量装饰填充空白
10. 每个页面重新生成一套房间
11. 绿色按钮遍布整个画面
12. 用卡片数量弥补视觉层级不足

---

# 20. 页面实现架构

推荐：

```text
Page
│
├── App Shell
│
├── World / Scene
│   ├── Background
│   ├── Room Master
│   ├── Furniture
│   ├── Character
│   └── Lighting
│
└── UI Overlay
    ├── Status
    ├── Card
    ├── Player
    └── CTA
```

房间相关页面继续复用：

```text
room-map.js
room-sync.js
player.js
```

不要因为视觉重构而复制这些状态机。

---

# 21. React / Web / 小程序实现层的统一思想

即使当前运行环境是微信原生小程序，也采用“游戏场景 + UI Overlay”的思想。

不要把所有东西都当成普通流式列表。

对于房间：

```text
Scene Container
position: relative

Background / Room
绝对定位

Furniture
绝对定位

Characters
绝对定位

Interaction Bubble
绝对定位

UI
普通文档流 / Overlay
```

房间内部的视觉坐标必须集中管理。

---

# 22. 视觉坐标规范

对于 Room Master Scene，建立明确的 scene coordinate system。

示例：

```text
sceneWidth
sceneHeight

wallLeft
wallRight
floor

sofa.x
sofa.y
sofa.scale
sofa.z

lamp.x
lamp.y
lamp.scale
lamp.z

turntable.x
turntable.y
turntable.scale
turntable.z

momo.x
momo.y
momo.scale
momo.z
```

不要在不同 WXML/WXSS 文件里散落大量 magic numbers。

---

# 23. 交互与视觉必须分离

例如家具数据：

```js
{
  id,
  asset,
  x,
  y,
  scale,
  zIndex,
  hitbox,
  collision,
  interaction
}
```

视觉资产变了：

> 不应该破坏家具逻辑。

家具位置变了：

> 不应该影响播放器状态。

这就是视觉系统和业务逻辑解耦。

---

# 24. Motion / 动画

动画不要大量使用。

优先：

### 角色

- idle
- walk-a
- walk-b
- sit

### 状态

- LIVE 呼吸
- 播放器旋转 / 轻微律动
- 灯光缓慢变化
- 投影轻微变化

### UI

- press scale
- selected
- save feedback
- sync feedback

动画原则：

> 慢、轻、克制。

Roomie 是低压力陪伴产品，不是竞技游戏。

---

# 25. 截图视觉验收：必须建立 Visual QA Loop

这次视觉重置的完成标准不能是：

> “Agent 说完成了。”

必须是：

```text
Reference
↓
Render
↓
Diff
↓
Identify mismatch
↓
Fix
↓
Render again
↓
Diff again
```

建立：

```text
reference-assets/ui-reference/

renders/

diff/
```

推荐：

```text
reference-assets/ui-reference/home.png
reference-assets/ui-reference/friends.png
reference-assets/ui-reference/song.png
reference-assets/ui-reference/duo.png
reference-assets/ui-reference/architect.png
reference-assets/ui-reference/profile.png
reference-assets/ui-reference/postcard.png
```

---

# 26. Visual Diff 的问题分类

每次截图后必须按以下顺序检查：

## A. Geometry

- 位置
- 尺寸
- 比例
- 间距
- 房间占比
- 角色比例

## B. Composition

- 视觉中心
- 信息层级
- 留白
- 密度
- 房间是否成为主角

## C. Visual

- 颜色
- 材质
- 阴影
- 光照
- 字体
- 图片质量

## D. Depth

- z-index
- 遮挡
- 前后关系
- 地面接触

## E. Motion

- 动画速度
- 状态变化
- 角色行动

修复顺序必须：

```text
Geometry
↓
Composition
↓
Asset
↓
Lighting
↓
Typography
↓
Micro Detail
```

不要一开始修阴影。

---

# 27. “连续三次没改对”规则

如果 Agent 连续三轮修改仍然不能解决同一个问题：

> **停止继续调整 CSS。**

重新判断问题属于哪一层：

```text
Layout?
Asset?
Camera?
Lighting?
Material?
Architecture?
```

例如：

如果沙发始终不像参考图，禁止继续修改 border-radius。

应该检查：

> 是否应该更换 sofa.webp。

如果房间始终显得太小，禁止继续调整内部家具。

应该检查：

> Room Master 的 viewport / scale / camera 是否错误。

---

# 28. 实施阶段

## Phase 0：冻结现状

执行：

- 当前页面截图归档
- 当前功能状态不改
- 当前测试基线保存

## Phase 1：资产盘点

输出：

- 当前所有房间资产
- 当前家具资产
- 当前角色资产
- 当前唱片资产
- 当前背景
- 当前 UI 图标

标记：

```text
保留
重绘
替换
废弃
```

## Phase 2：Room Master Scene

只制作：

- 背景
- 墙
- 地面
- 唱片墙
- 唱机
- 放映墙
- 沙发
- 灯
- 吉他
- 音箱
- 植物
- 桌子
- MOMO
- KIKI
- 光照

直到达到视觉基准。

## Phase 3：房间交互接入

确保：

- 移动
- 碰撞
- 遮挡
- 点击
- 家具状态
- 房间同步

仍然可用。

## Phase 4：Home

先将 Room Master 引入 Home。

## Phase 5：Duo / Architect

使用同一套 Room Master Scene。

## Phase 6：Friends / Song / Profile / Postcard

从 Master Scene 派生视觉资产。

## Phase 7：统一 UI

最后再处理：

- Header
- Card
- Player
- CTA
- Tab
- 状态

---

# 29. 必须优先完成的工作列表

按照优先级执行：

```text
P0
[ ] Room Master Camera
[ ] Room Master Composition
[ ] Room Master Furniture Assets
[ ] Record Wall
[ ] Warm Lighting
[ ] Material System
[ ] Character Integration

P1
[ ] Home composition
[ ] Duo composition
[ ] Architect preview
[ ] Friends mini-room system
[ ] Song visual system

P2
[ ] Profile
[ ] Postcard
[ ] Micro-interactions
[ ] Fine typography
[ ] Decorative details
```

---

# 30. 当前代码中应尽量保留的部分

除非发现明确的视觉架构阻碍，优先保留：

- 页面路由
- 数据状态
- Player 单例
- RoomSync
- RoomMap
- Furniture State
- `roomie_room`
- `roomie_records`
- `roomie_unread`
- 角色状态机
- Canvas 明信片流程
- Custom Tab

视觉重构的目标是：

> **换皮肤背后的视觉系统，而不是重写产品。**

但对于直接阻碍视觉质量的旧“整体房间大图”结构，可以进行必要拆分，并确保功能契约不受影响。

---

# 31. 最终视觉验收标准

完成后必须满足：

## 房间

- [ ] 一眼能识别 Roomie 的音乐空间
- [ ] 等距微距成立
- [ ] 房间足够大
- [ ] 唱片墙清晰可见
- [ ] 唱机 / 放映墙是视觉锚点
- [ ] 家具有真实生活感
- [ ] 材质有区别
- [ ] 暖光进入整个空间
- [ ] 夜景与室内暖光形成冷暖对比
- [ ] 角色融入空间
- [ ] 有正确遮挡和脚底阴影

## UI

- [ ] UI 不再压过房间
- [ ] 绿色只用于关键状态/操作
- [ ] 米白纸张与房间材质协调
- [ ] 卡片不再成为主要视觉主体
- [ ] 页面之间具有统一设计语言

## 页面

- [ ] Home：房间是第一视觉主角
- [ ] Friends：朋友房间具有“邻居感”
- [ ] Song：像从房间中取出唱片
- [ ] Duo：两个人真的在同一空间
- [ ] Architect：像室内设计工作台
- [ ] Profile：像个人房间档案
- [ ] Postcard：像真正寄出的深夜明信片

---

# 32. 功能回归验收

视觉重构完成后必须重新执行原项目已有验证：

```powershell
node tools/test-player.js
node tools/test-sync.js
node tools/test-room-map.js
node tools/check-bindings.js

Get-ChildItem miniprogram -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { node --check $_.FullName }
```

此外必须人工检查：

```text
首页 → 房间
房间 → 歌曲
好友 → 邀请
邀请 → Duo
Duo → 退出
Create → Architect
Architect → Room
Profile → Record Wall
Create → Postcard
Postcard → Save / Share
```

---

# 33. Agent 最终执行 Prompt

把下面这段作为本文件的执行指令：

```text
你现在负责 Roomie 的“视觉资产重置”，不是普通 UI 微调。

当前代码的核心功能已经存在，不要推倒重来。

你的目标不是把现有页面再加几层阴影、渐变、圆角，而是重建 Roomie 的核心视觉世界。

请严格执行：

1. 先读取现有 Roomie 开发手册、规格文档和当前页面代码。
2. 盘点现有视觉资产，并把每项标记为：保留 / 重绘 / 替换 / 废弃。
3. 暂时冻结 Friends / Song / Duo / Architect 等页面的局部视觉抛光，不要继续零碎调 CSS。
4. 优先重建 Room Master Scene。
5. Room Master 必须使用“等距微距”视角，而不是远距离小游戏地图视角。
6. 房间必须具备真实音乐空间的生活感：胡桃木、唱片墙、唱机、沙发、灯、吉他、音箱、植物、投影、收藏物件。
7. 必须建立真正的材质差异：墙、木、黑胶、金属、织物、玻璃。
8. 必须建立真正的空间灯光：深夜冷色外部 + 2700K 左右暖色室内 + 投影光。
9. 角色必须真正融入空间，并保留脚底阴影、统一光源和家具遮挡。
10. 房间必须由可分离的视觉资产组成，不能把所有东西永久做成一张不可交互的大图。
11. 家具资产、角色资产、唱片资产必须可以复用。
12. Architect 中显示的家具必须和 Room Master 中的家具是同一套资产。
13. Friends 中的 mini-room 必须从 Master Scene 派生，不要重新画廉价的缩略图房间。
14. Home / Duo / Architect 优先使用 Room Master Scene。
15. Song 需要体现“从房间中取出一张唱片”，不要变成普通音乐 App。
16. Duo 必须体现“两个人真的在同一个房间里”。
17. Profile 必须体现“我的私人房间档案”。
18. Postcard 必须体现“寄出的深夜音乐明信片”。
19. UI 只作为 overlay，不得压过 Room World。
20. 视觉实现中优先使用高质量 WebP / PNG / SVG / Canvas / 预渲染资产，而不是用大量 CSS 硬画复杂材质。
21. 不允许使用大量渐变、shadow 和圆角去掩盖低质量资产。
22. 每次修改后必须截图。
23. 必须进行 reference vs render 的视觉比较。
24. 如果连续三轮仍解决不了同一个视觉问题，必须重新判断问题属于 layout / asset / camera / lighting / material / architecture，而不是继续改 CSS。
25. 必须保留原有 Player、RoomSync、RoomMap、家具交互、角色移动、DIY 持久化等功能。
26. 完成视觉修改后执行原项目全部自动化和语法验证。

第一阶段只接受：

【Room Master Scene 达到视觉基准】

之后再把它迁移到各个页面。

不要把“整体风格像了”当成完成标准。

完成标准是：

Roomie 的房间本身已经足够漂亮，能独立成为整个产品的视觉锚点。

最后输出：
- 资产盘点
- 新增资产
- 删除资产
- 重做资产
- Room Master 的结构
- 每页的视觉改动
- 截图路径
- Visual Diff 结果
- 功能测试结果
- 剩余问题
```

---

# 34. 最终判断标准

不要问：

> “这个页面是不是已经挺好看了？”

改问：

> **“如果把 Roomie Logo、绿色按钮和中文文案全部删掉，只留下房间，它是否仍然像一个有完整世界观的产品空间？”**

如果答案是否定的，说明美术资产仍然不够好。

再问：

> **“如果把房间删掉，只留下 UI，这些页面是不是会立即变成一个普通的移动 App？”**

如果答案是肯定的，说明房间还没有成为真正的视觉核心。

最终目标是：

```text
UI 好看
+
Room World 好看
+
两者拥有同一套视觉语言
+
互动真实存在于这个世界里
=
真正的 Roomie
```

---

# 35. 本次重置的完成定义

只有同时满足以下条件，视觉重置才算完成：

1. Room Master Scene 达到目标审美基准。
2. 房间具有等距微距构图。
3. 家具、唱片、角色和灯光具有独立资产与明确空间层级。
4. 房间拥有生活感、收藏感、材质差异和冷暖光关系。
5. Home / Duo / Architect 能复用同一套世界资产。
6. Friends 的 mini-room 与 Master Scene 风格统一。
7. Song / Profile / Postcard 使用相同的视觉语言。
8. UI 不再成为房间的视觉竞争者。
9. 每个页面都有截图证据。
10. 视觉问题经过至少一轮明确的 comparison / correction。
11. 功能回归测试全部通过或明确记录环境阻塞。
12. Agent 不得用“已实现”替代真实视觉验收。

**最终原则：先把 Roomie 的世界做对，再把页面做对。**
