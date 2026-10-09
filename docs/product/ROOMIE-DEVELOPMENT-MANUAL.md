# Roomie 核心开发手册

> 文档状态：基于仓库当前实现整理（2026-10-04）。
> 适用范围：`miniprogram/` 小程序代码、`tools/` 验证与同步工具、`figma-assets/` 与 `preview-app/` 演示资产。
> 配套规格：`./ROOMIE-MINIPROGRAM-SPEC.md`。

## 1. 目标

### 一句话目标

交付一个可运行、可演示、可验证的 Roomie 微信小程序，完成“进房间 → 一起听 → 邀请好友 → DIY 房间 → 分享明信片”的低压力音乐同频陪伴闭环。

### 产品设定

Roomie 是一间有音乐的虚拟放映室：用户通过房间空间、唱片墙和角色动作表达自己，再邀请朋友“来家里坐坐”，共同听歌或观看放映。

### 成功边界

- Demo 期优先保证核心链路可操作、可复现、可讲解。
- 音乐、好友、房间同步采用 mock 或本地中继，不能暗示已接入生产服务。
- 每项验收必须附可复现命令、截图路径或开发者工具操作记录。
- 当前代码、演示素材和提交材料必须保持同一套页面命名与产品叙事。

## 2. 仓库结构

| 路径 | 职责 | 维护规则 |
| --- | --- | --- |
| `miniprogram/` | 微信原生小程序工程 | 页面、组件、全局样式和运行时工具的唯一实现来源 |
| `miniprogram/pages/` | 10 个页面：`home`、`friends`、`create`、`messages`、`profile`、`room`、`song`、`duo`、`architect`、`postcard` | 每个页面保持 `.js/.json/.wxml/.wxss` 同名配对；路由以 `app.json` 为准 |
| `miniprogram/components/mini-player/` | 复用播放器组件 | 通过 `Player` 订阅快照；页面不要复制播放器状态机 |
| `miniprogram/custom-tab-bar/` | 五项自定义 Tab 与未读角标 | 只负责导航和角标展示，不承载业务状态 |
| `miniprogram/utils/player.js` | 全局 mock 播放器单例 | 统一播放、暂停、切歌、seek、歌词索引和订阅 |
| `miniprogram/utils/room-sync.js` | 房间 WebSocket 客户端 | 连接失败自动回退模拟 peer；页面只消费事件接口 |
| `miniprogram/utils/room-map.js` | 地板菱形边界、障碍物、A* 寻路与景深 | `room` 与 `duo` 共用；底图由 `tools/gen-room-scene.js` 生成，布局变化后同步障碍物坐标 |
| `miniprogram/assets/img/` | 运行时 WebP/JPG 资源 | 资产尺寸、命名和引用路径必须稳定 |
| `figma-assets/` | SVG/PNG 设计源文件 | 只作为源资产，不直接作为小程序运行时依赖 |
| `reference-assets/room-inspiration/` | 室内布局与唱片墙参考图 | 只用于设计评审，不进入小程序运行时包 |
| `preview-app/` | HTML 高保真演示页和截图 | 用于缺少开发者工具时的视觉证据，不替代小程序验收 |
| `tools/` | 压缩、同步、静态校验和自动化脚本 | Node CommonJS；依赖只放在 `tools/node_modules/` |
| `docs/project/PLAN.md` | 交付节奏与每日验收记录 | 记录阶段目标，不新增产品机制 |
| `docs/project/PROGRESS.md` | 实际完成项、风险与阻塞 | 事实优先；明确区分已验证与待环境验证 |
| `docs/competition/SUBMISSION.md` | 比赛提交检查表 | 提交材料和评分维度映射 |
| `docs/competition/DEMO-SCRIPT.md` | 3 分钟演示讲稿 | 演示顺序必须与规格中的闭环一致 |

## 3. 实现约束

### 平台与依赖

- 使用微信原生 WXML/WXSS/JavaScript；不引入第三方小程序框架。
- 运行时不依赖外网；音乐、好友、房间数据使用本地 mock。
- `project.config.json` 的 `miniprogramRoot` 为 `miniprogram/`，导入时选择仓库根目录。
- 小程序兼容基础库以配置中的 `3.4.0` 为下限；避免依赖低版本不支持的 CSS 简写和组件配置。
- `tools/` 可使用 `sharp`、`ws`、`miniprogram-automator`，这些依赖不打入小程序主包。

### 数据与状态

- 全局播放器只能由 `miniprogram/utils/player.js` 管理；页面通过 `subscribe()` 获取快照，并在隐藏或卸载时退订。
- 房间装修写入 `roomie_room`；唱片墙选择写入 `roomie_records`；消息未读数写入 `roomie_unread`。
- 读取本地缓存必须经过字段级默认值回退，不能相信旧版本缓存结构。
- 重要状态必须有空态、加载态、失败态或重复点击保护。

### 房间同步

- `room-sync.js` 默认连接 `ws://127.0.0.1:8765`，真机演示需改为电脑局域网 IP。
- 位置广播节流为 150ms；家具状态和互动动作使用 `state/action` 消息。
- 连接失败或断线时回退到本地模拟 peer，页面仍可完成演示。
- 不把本地中继描述为生产级实时服务；正式版迁移目标为云开发实时数据库或腾讯云 IM/TRTC 信令。

### 版权与资产

- Demo 不播放真实版权音频；歌词只保留少量演示行或占位文本。
- 分享卡片和 Canvas 使用 `room-postcard.jpg`；不要把 WebP 直接用于不稳定的 Canvas/分享解码路径。
- 视觉基线为米白底、绿色主色、蓝天空间、等距 2.5D 房间和 Q 版角色；新增页面必须复用全局令牌。
- 资产变更后运行压缩脚本，并检查主包体积和未引用文件。
- 当前角色临时映射为：MOMO 使用橙色圆润形象，KIKI 使用黄色奶龙形象；资源由 `tools/prepare-character-assets.js` 从本机参考图提取透明背景后生成。
- 参考图来自外部平台，仅作为临时演示素材；对外发布或提交正式版本前必须替换为已获授权或团队原创资产。

### 室内布局与唱片墙参考

参考素材只提炼设计规律，不直接复制图片、海报封面或房间照片到运行时资源。实现时遵守以下空间语法：

- **生活化排练室**：允许鼓、吉他、键盘、音箱、效果器和线材形成轻度“使用痕迹”，但控制在 2–3 个视觉焦点，避免把房间画成杂物堆。
- **R&B 音乐小屋**：使用整面混合画廊墙，把唱片、海报、人物肖像和乐器组合成个人兴趣墙；墙面内容应有大小、材质和色彩层次。
- **白墙模块展陈**：唱片和封面采用统一网格或透明框模块，保留稳定间距、卡片阴影和暖色射灯，作为建筑师模式的“整齐”风格。
- **木质层板**：用深胡桃木层板承托唱片封套，采用“封套—黑胶—封套”的节奏，形成可读的横向层级。
- **收藏型唱片墙**：允许多排密集陈列，但必须保留主唱片机、放映墙和角色移动的留白区域。
- **色彩与灯光**：基础空间使用米白、深木色、炭黑和少量唱片标签色；2700K 暖光强调居住感，6000K 冷光只用于建筑师模式预览。

空间实现优先级为：角色可移动区域 > 播放器和放映墙 > 唱片墙主视觉 > 装饰性小物。新增家具必须说明占用区域、点击区域、遮挡层级和碰撞边界。

## 4. 开发与交付规则

1. 先更新规格或验收条目，再修改实现。
2. 新增页面必须同时更新 `app.json`、规格中的页面契约和演示路径。
3. 修改状态接口时同步更新调用页面、静态校验脚本和测试证据。
4. 每次交付至少运行播放器测试、同步测试、绑定校验和 JavaScript 语法检查。
5. 视觉变更同时更新 `preview-app/` 或补充开发者工具截图，不能只凭代码描述效果。
6. 结论使用三种标签：`已验证`、`代码已实现但依赖环境`、`后续规划`。

## 5. 标准验证命令

```powershell
# 播放器状态机：19 项断言
node tools/test-player.js

# 房间中继：7 项断言
node tools/test-sync.js

# 房间地图：地板菱形边界 / 碰撞 / A* 寻路 / 景深，15 项断言
node tools/test-room-map.js

# WXML 顶层绑定与页面 data 交叉校验
node tools/check-bindings.js

# 从本机参考图重新生成 MOMO/KIKI 透明角色资源
node tools/prepare-character-assets.js

# 页面 JavaScript 语法检查
Get-ChildItem miniprogram -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { node --check $_.FullName }
```

开发者工具人工验收必须覆盖规格文档中的 9 步闭环，并保存首页、房间、歌曲、双人、建筑师、我的、明信片截图。若受 AppID 或工具版本阻塞，必须在 `docs/project/PROGRESS.md` 记录阻塞原因，不能把 HTML 复刻截图标记为真机证据。

## 6. 完成定义

一次变更只有同时满足以下条件才算完成：

- 页面可从既有路由进入，返回和 Tab 状态正确。
- 核心状态在相关页面之间同步，离开页面不会重复订阅或残留定时器。
- 空态、失败态和重复点击行为可解释。
- 至少一条自动化或静态验证通过，并有路径明确的视觉或手工证据。
- 文档、演示脚本和提交检查表没有与实现冲突的描述。
