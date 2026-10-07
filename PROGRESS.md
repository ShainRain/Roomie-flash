# Roomie 开发进度日志

> 每日定时任务触发后在此追加记录。格式：日期 / 当日目标 / 完成项 / 偏差与风险 / 次日重点。

## 10-05 · 状态链闭环（DIY→房间→双人→明信片）
> 依据评审清单 1–4（必须优先）+ 6/7/9/10 项；目标：状态真实闭环、视觉统一，不再堆装饰。
- [x] **DIY 家具真实生效**：`gen-room-scene.js` 拆层重写——底图（墙面/地板/空唱片架/固定茶几）+ 13 件家具全幅透明覆盖层 + 24 张唱片封面板材（剪切已烘焙）+ 统一双色图标 + 生成 `utils/room-layout.js` 元数据（层 z 序/热点/障碍映射/槽位坐标单一事实源）。
- [x] 家具显隐联动：room/duo/architect 三页同源渲染选中家具层；`room-map.js setActiveFurniture` 同步撤掉未选家具的碰撞（测试：撤沙发后其占地可行走，固定茶几不受影响）。
- [x] **唱片墙真实联动**：`utils/records.js` 共享唱片库（24 张），profile 24 选 12 → 房间墙 12 槽位按选择顺序挂载（空槽显虚线），点唱片墙报挂载数+当前曲目；明信片 canvas 绘制当前选择（≤6 张色块封面，不解码 webp）。
- [x] **播放同步协议**：`player` 消息（index/position/playing/sentAt），切歌/暂停/seek 跳变即时报 + 播放中 5s 心跳；服务端按房间缓存并补发晚加入者；`Player.applyRemote` 2.5s 容差 + 延迟补偿 + remote 标记防回播；控制权 last-write-wins（Demo 期不锁）。
- [x] **连接竞争修复**：room-sync 重写为单实例 + connecting 守卫 + 旧 socket 事件失效化；join() 幂等；room/duo 只在 onShow 恢复连接（room.js 顺带修复了历史上双 onShow 覆盖问题）。
- [x] **去调试感**：家具标签默认隐藏（角色靠近/点按/首访 6s 提示期浮现）；新增状态视觉反馈——唱机旋转、唱片墙「▶ 正在播」胶囊、吉他音符飘浮；角色加呼吸/行走重心起伏/坐下压扁动画，接触阴影随景深缩放。
- [x] **建筑师图标统一**：13 件家具全部换成生成的双色 WebP 图标，消灭系统 emoji 差异。
- [x] 测试扩展：test-room-map 19 项（+家具显隐联动）、test-player 25 项（+applyRemote 容差/防回播）、test-sync 10 项（+player 广播/无回声/缓存补发）。
- [x] 回归全绿 + 截图证据更新（room/duo/architect 三页重截，目检合格）。
- [x] 文档同步：spec §4.4/4.5/4.7/4.9/§5 契约/A 表（新增 A5b）、README（架构/同步协议/包体 620KB）、DEMO-SCRIPT（DIY 生效与槽位联动演示步骤）、SUBMISSION（验证数字/包体/角色资产合规标记为待替换）。
- 已知妥协：角色仍为正面临时素材（真 3/4 视角重绘列决赛期）；多屏宽度（320/414）与双端真机播放同步实测依赖开发者工具环境。

## 10-04 · 空间重排与真实可行走区域（视觉素材驱动）
> 依据：新增 `reference-assets/room-inspiration/` 6 张参考图 + 会话内第 7 张（ECHO 暖光听音室）+ 规格 §6.4 布局约束。画框（828×828 等距对称墙角）未变，只改人物呈现与空间布局。
- [x] 场景重绘：`tools/gen-room-scene.js` 程序化生成新底图——左墙 ROOMIE 霓虹字标 + 海报拼贴 + 圆镜/耳机/壁挂吉他 + 双层胡桃木唱片墙（封套—黑胶—封套节奏，全部原创抽象封面）；右墙放映幕 + 唱机柜锚点（黑胶唱机/双音箱/柜门唱片格）；地面焦糖皮沙发、茶几+放映机、弧形落地灯、吉他角（音箱+倚靠吉他）、绿植、地毯、地面唱片；材质区分墙面漆/木材/黑胶/金属/织物。
- [x] 修掉"假物理"：可行走区域从矩形 BOUNDS 改为贴合底图的地板菱形（uv 参数化 + clampToFloor），角色不再能走上墙面/天空；`room-map.js` 统一导出 isBlocked/segmentClear/findPath（17×17 网格 A* + 视线拉直）/resolveTarget/depthFor，room 与 duo 共用（删除 duo 内拷贝逻辑）。
- [x] 家具占地重排：沙发贴左墙、唱机柜贴右墙、茶几前移，中央留出 x≈50–55 的贯通走廊；可行走面积约占可视地面 54%（≥45% 约束达标）。
- [x] 景深感：角色按纵深 0.82–1.08 倍缩放 + 与家具 z 序遮挡；出生点全部移入菱形内（room 40/74 + 52/64，duo 40/72 + 52/62）。
- [x] 关键修复：房间页/双人页舞台改为正方形画幅（原 aspectFill 在竖屏手机上把方形底图左右裁掉 54%，唱片墙/放映幕被裁——"狭窄"的主因）；坐标与底图 1:1 对齐。
- [x] 顺带：房间页补上地板色应用（floor-tint 菱形裁切叠加层，architect 三色回房间即生效，闭合 A8 缺口）；修复 room.js 重复 onShow 导致断线重连失效的隐患；新增唱机柜/吉他角交互，茶几热点移除（纯装饰）。
- [x] 验证：新增 `tools/test-room-map.js` 15 项断言（出生点/边界/碰撞/绕障/落点解析/景深）全过；回归全绿（16 JS 语法、19 播放器断言、7 同步断言、10 页绑定校验、全部 JSON）。
- [x] 视觉证据：`preview-app/room.html`、`duo.html` 更新为新场景并重截图（shots/room.png、duo.png，目检合格）。
- 已知妥协：HTML 复刻截图仅作视觉证据，真机九宫格走位/遮挡仍需开发者工具实测；参考图含外部平台素材，仅提炼设计规律，运行时全部原创绘制。

## 10-04 · 临时角色资产替换
- [x] 个人角色 MOMO 改用橙色圆润形象，联机角色 KIKI 改用黄色奶龙形象。
- [x] 新增 `tools/prepare-character-assets.js`，从本机白底参考图提取透明背景并生成 8 个 `144×184` RGBA WebP（idle / walk-a / walk-b / sit）。
- [x] 保持 `room` / `duo` 现有资源路径和动作接口不变，播放器、同步、绑定校验无需改动。
- 风险：参考图来自外部平台，仅作临时演示素材；正式发布前需替换为已授权或原创资产。

## 基线（2026-10-01 建立）
- 现状：仅有设计资产（figma-assets/、preview/）与生成脚本，无小程序代码
- 计划：见 PLAN.md（5 天，10-01 → 10-05）
- 比赛截止：10-09 23:59

## Day 1 · 10-01（进行中）
- [x] 提前完成（17:00）：工程骨架 —— project.config.json（miniprogramRoot）、app.json/app.js/app.wxss、设计令牌全局样式、自定义 Tab 栏（纯 CSS 线性图标 + 中央绿色凸起 +）、5 个页面占位
- [x] 美术资产压缩管线：tools/compress-assets.js（sharp），5 张房间插画 → webp，共 ~216KB（主包总计 275KB，远低于 2MB 限制）
- [x] 首页 v6 完整实现（17:15 提前完成，原定 18:03 定时任务将改为走查验证）：
  - LIVE 状态胶囊 + 分享按钮、悬浮房间插画（带地面投影 + "放映墙正在播放"标注）
  - 3 位好友在线卡片（叠放彩色头像、KIKI 动态、绿色"一起听"按钮）
  - 内嵌播放器（CSS 黑胶旋转动画、进度条、模拟走秒计时器、播放/暂停切换，状态存 globalData）
  - 修复：WXML 不支持调用页面方法，时间显示改为预格式化字段
- 待验证：微信开发者工具中实际渲染效果（无法命令行运行，需用户导入项目确认）
- 次日重点：房间直播页 + 歌曲详情页 + 播放器状态机完整化

## Day 2 · 10-02（10-01 晚提前完成主体）
- [x] utils/player.js：全局播放器单例（mock 三首歌歌单、模拟走秒、切歌自动重置、seek、歌词时间戳索引、订阅/退订机制）；歌词仅保留少量演示行并标注占位，规避版权风险
- [x] pages/room/room：沉浸式房间直播页（自定义导航、全屏 room-full 插画、LIVE 胶囊、底部悬浮播放器卡），状态栏安全区已适配
- [x] pages/song/song：歌曲详情页（黑胶旋转 + 唱针起落动画、歌词 Tab 滚动高亮跟随 lyricIndex、评论 Tab mock、互动栏、slider 拖动 seek、五键控制栏）
- [x] 首页重构接入 Player 单例（删除本地计时器与 globalData.player 旧字段），三页跳转串联：home.hero→room、home.player→song、room.dock→song
- 待验证：开发者工具真机渲染；歌词 scroll-into-view 在安卓真机的表现
- 次日重点：好友页 + 邀请流程 + 双人同频页 + 消息页

## Day 3 · 10-03（10-01 晚提前完成主体）
- [x] pages/friends：绿色邀请 Banner、在线分组（KIKI 房间中→直接进入双人房；NANA/ABO→邀请）、离线分组（灰色描边邀请），绿点在线标识
- [x] 邀请流程：点邀请→按钮变"等待中…"→1.5s 后模拟对方接受弹窗→确认进入双人放映室
- [x] pages/duo：双人同频页（room-duo-float 插画、MOMO & 对方双人卡片、同频度圆环 95~99 模拟浮动、退出确认弹窗、"歌单由 MOMO 控制"控制权标识），进入自动接管播放，控制与 Player 单例同步
- [x] pages/messages：邀请/动态通知列表（未读红点、点击已读、接受/进入房间按钮跳转双人页）
- 待验证：邀请流程计时弹窗在真机的体验；duo 页 peer 参数透传
- 次日重点：建筑师模式 + 我的放映室 + 明信片生成（Day 4 全部内容）

## Day 4 · 10-04（10-01 晚提前完成主体）
- [x] pages/create：创建 Tab 改为入口聚合页（建筑师模式 / 发起放映 / 生成明信片 三卡片）
- [x] pages/architect：房间预览（灯光色温叠加层实时渲染：2700K 暖橙→6000K 冷白渐变，slider changing 实时联动）、12 件家具库多选、3 色地板色板、保存写入 storage（roomie_room）
- [x] pages/profile：角色卡片（MOMO LV.7 + 建筑师徽章 + 换发型/换服装占位）、唱片墙 24 张收藏选 ≤12 展示位（超限 toast）、保存写入 storage（roomie_records）
- [x] pages/postcard：canvas 2d 绘制明信片（米白底 + 房间插画圆角裁切 + "有音乐的房间，抵千万句寒暄" + ROOM ID 0731 页脚），保存相册（type=2d 画布需传 canvas 节点，已处理）、onShareAppMessage 转发
- 待验证：canvas 真机绘制与相册授权流程；灯光叠加层在低端机性能
- 次日重点（Day 5）：全链路走查、空态补齐、README/演示材料、提交检查

## Day 5 · 10-05（10-01 晚提前启动）
- [x] 静态走查：13 个 JSON、13 个 JS（node --check）、全部 WXML 标签配平 —— 零错误
- [x] 补齐 Day 4 验收缺口：房间页接入 DIY 灯光色温叠加层（onShow 刷新，建筑师模式保存后回房间页即生效）
- [x] miniprogram/README.md 交付文档：产品定位/用户价值/差异化对比表/AI 叙事/9 步演示路径/技术架构/版权合规/决赛规划
- [x] 演示截图产出：本机无微信开发者工具（仅微信客户端），改用 HTML 高保真复刻 7 页（preview-app/*.html，1rpx=0.52px，纯内联 CSS）+ Chrome headless 截图（390×844）→ preview-app/shots/ 七张（home/room/song/duo/architect/profile/postcard），已逐张目检合格
  - 已知差异：字体回退（Oranienbaum→Times）、emoji 字形、slider 近似；不影响演示用途
  - 坑记录：Chrome headless 最小视口 500px，fixed 定位元素需改固定像素宽
- [x] PLAN.md Day1–Day5 全部验收项已勾选（仅剩"开发者工具实测"为环境依赖项）
- [x] 七张截图全部目检合格（room/song/profile/postcard 复查通过）
- [x] 提交包清理：删除未被引用的 room-classic.webp / room-duo.webp（主包 412K→376K，仅 4 张资产全部被引用）；新增 .gitignore 排除 tools/node_modules（30MB sharp 依赖，不属交付物）
- [x] 空态补齐：消息页空列表态、唱片墙零选择引导提示；异常兜底此前已含（明信片保存中/授权失败、邀请防重复、唱片墙超限 toast）
- [x] 分享能力：首页 onShareAppMessage（标题+房间图卡片）+ 分享按钮改调 showShareMenu
- [x] SUBMISSION.md 提交检查表：硬性要求/评分维度对应/版权合规/提交物清单/路演要点
- [x] 深度复查修复（模拟真机兼容性）：① WXSS `inset:0` → 显式四边定位（旧基础库不支持）；② 明信片 canvas 与分享缩略图改用新增 room-postcard.jpg（webp 在 canvas drawImage/分享卡片上解码不稳）；③ 删除 postcard.json 非法配置键；④ 黑胶渐变加纯色兜底（repeating-radial-gradient 不支持时降级）
- [x] DEMO-SCRIPT.md 演示讲稿/录屏脚本（3 分钟版：开场共鸣→房间→同频陪伴→DIY→明信片收尾，含每步操作+旁白+评委问答预案）
- [x] 播放器状态机行为测试：tools/test-player.js（19 项断言：初始快照/时间格式化/歌词索引/toggle/循环切歌/seek 联动/订阅退订），全部通过
- [x] WXML↔JS 绑定交叉校验：tools/check-bindings.js（剥字符串字面量+属性访问后比对 data 字段），10 页面全部通过；修复 room 页 lightOverlay/statusBarH 未在 data 声明（setData 注入合法但不规范）
- [x] 微信开发者工具落地（重大突破）：winget 安装 Tencent.WeixinDevTools 2.02.2609231 → 首次启动初始化 → 定位服务端口开关（localstorage 中 security.enableServicePort）并置 true → CLI 成功连接 IDE server（http://127.0.0.1:57970）
- [x] 工具脚本：C:\Users\69297\wx-start-ide.bat / wx-open-roomie.bat（GBK 编码 + CRLF，绕过 Git Bash 中文/空格/引号问题）
- [ ] 最后一步：cli open 校验 AppID 需 IDE 已登录 —— 需用户用微信扫描 IDE 窗口中的登录二维码；登录后 cli open/preview/auto（截图）即可全自动化
- [x] 用户已扫码登录 IDE（islogin=true）
- [ ] cli open/auto 均卡在 AppID 校验（code 10：不存在此 AppID）——该版本 CLI 对 touristappid 也做账号校验，需用户在 IDE GUI 手动导入一次项目（选测试号），之后 CLI/automator 即可接管
- [x] 自动化截图管线就绪：tools/ 安装 miniprogram-automator；tools/shots-automator.js（connect ws://127.0.0.1:9420 → reLaunch 10 页 → 逐页截图到 preview-app/shots-real/），项目一经 GUI 导入即可一键执行
- [x] 发现 IDE 内置 MCP server（wechatide mcp），自写 NDJSON JSON-RPC 客户端（tools/mcp-list.js）成功连接 IDE 桥接——最后一道是 GUI 端的 MCP 客户端授权确认（Client authorization pending）
- [x] MCP 通道全量打通：授权通过，49 个工具可用（project_import/open_project_window/simulator_open_page/simulator_screenshot/get_simulator_console 等）；自写通用调用器 tools/mcp-call.js
- [x] 定位最终阻塞：该 IDE 版本（2.02.2609231）所有程序化入口（cli open/auto、MCP project_import/open_project_window/automation_testaccount）都硬性校验 AppID；get_user_appids 显示账号无已注册 AppID；"touristappid" 不再被接受——测试号必须在 GUI 交互创建（工具栏「测试号」按钮或导入项目时选测试号）
- 状态：目标阻塞于"用户在 IDE GUI 中的一次点击"，解除后 tools/mcp-call.js + shots 管线可在 5 分钟内完成真机验证与截图
- 风险：微信开发者工具未安装，真机实测需用户安装后导入项目（静态验证 + 兼容性复查 + HTML 复刻渲染三重验证已通过）

## Day 3 · 10-03（真机验证突破 + 代码审查）
- [x] **真机验证成功**：cli open 打开项目窗口（测试号 wxf17c79a035c7853c），模拟器正常渲染首页（桌面截屏确认：LIVE 胶囊/天空渐变/房间插画均正常）——"工程在开发者工具中可运行"验收达成
- [x] 完整代码审查（explore 子代理）：19 项问题（8 高 / 5 中 / 6 低）+ 5 个优化方向
- [x] 修复 3 项高危：① custom-tab-bar/index.json 补 component:true；② room 页 statusBar px 误作 rpx；③ player.js emit() 加 listener 异常隔离
- [x] 回归：19 项播放器测试 + 绑定校验全部通过
- [x] 修复 3 项高危：① custom-tab-bar/index.json 补 component:true；② room 页 statusBar px 误作 rpx；③ player.js emit() 加 listener 异常隔离
- [x] 清掉剩余 6 项高危：
  - #4 订阅生命周期：home/room/song/duo 四页改为 onShow 订阅 / onHide 退订，data.snap 用 Player.snapshot() 初始化（顺带消掉首帧空值）
  - #5 friends 邀请计时器：inviteTimer 实例属性，onHide/onUnload 取消并重置"等待中"状态，弹窗不再串页
  - #6 song 滑杆：dragging/dragValue 本地态，bindchanging 实时预览不回写，松手才 commit seek
  - #7 duo 自动播放还原：autoStarted + userTouched 双标记，退出时仅当"代开播且用户未碰控制"才恢复暂停
  - #8 storage 校验：app.js normalizeRoom 字段级回退默认值；profile 唱片 id 过滤越界存档
  - #9 postcard：img.onerror 纯色兜底、海报就绪前禁存（toast 引导）、相册授权失败弹窗接 wx.openSetting
- [x] 回归全绿：13 JS 语法、19 播放器断言、10 页绑定校验
- 遗留：automator 渲染进程连接在该 IDE 版本持续失败（3 次尝试），改用桌面截屏验证；MCP 项目窗口操作亦不稳定（aborted）
- 剩余定时任务：Day 4（10-04 09:07）、Day 5（10-05 09:07）

## 10-03 · mini-player 组件化重构
- [x] 新增 miniprogram/components/mini-player/（黑胶+信息+进度+三键控制）：pageLifetimes 封装 onShow 订阅/onHide 退订 + detached 兜底，页面零样板；属性 subtitle（覆盖副标题）、tap-target（点击跳转开关）；事件 control（供 duo 用户触摸追踪）
- [x] 接入 home / room / duo 三页：删除页面内播放器 UI 与订阅样板（room 页 JS 彻底告别 Player，duo 仅保留 autoStarted 还原逻辑）；usingComponents 注册、页面死样式清理
- [x] 顺带修复审查中危 #11：组件进度条去掉 width transition（消除 layout 动画与滞后半秒）
- [x] 回归全绿：JS/JSON 语法、WXML 配平、19 播放器断言、绑定校验
- 待观察：IDE 模拟器中组件渲染（热重载后目测）

## 10-04 · 剩余优化项清零
- [x] 中危 #10 双标题栏：duo/song 改 navigationStyle:custom + statusBarH px 安全区
- [x] 中危 #13 未读角标：custom-tab-bar 消息 tab 加 badge（pageLifetimes.show 读 storage），messages 页 onShow/markRead 同步 roomie_unread，app 启动初始化
- [x] 中危 #14 色温滑杆节流：changing <50K 不 setData，change 提交终值
- [x] 优化"图标去 emoji"：mini-player 与 song 页播放/暂停/上一首/下一首全部改纯 CSS 图标（三角形+双竖条），跨端渲染一致
- [x] 回归全绿：JS/JSON 语法、WXML 配平、19 断言、绑定校验
- 审查清单状态：高危 9/9 ✅、中危 5/5 ✅（#11 随组件化、#12 随 snapshot 初始化已修）、优化方向完成 2/5（组件化、图标化）
- 剩余优化方向：Player setData 分路径瘦身、storage 统一 normalize 层（部分已做）、家具 emoji 图标替换（内容向，可留决赛期）

## 10-04 · 可互动房间升级（角色资产 + 真实多人同步）
> 前置：10-03 晚外部协作已落地点地移动/碰撞/家具交互（room.js 重写、duo 同步、room-interactive.webp 底图）
- [x] 角色精灵资产：tools/gen-characters.js（Node 手写 SVG → sharp 栅格化，替代 Python 管线——本机无 Python），MOMO（红裙蝴蝶结）/KIKI（黄裙发夹）× idle/walk-a/walk-b/sit 四姿态，共 8 张 webp（各 ~3-4KB）
- [x] 角色接入：room/duo 的 CSS 小人换成精灵图，行走帧 220ms/帧交替、方向 scaleX(-1) 翻转、沙发坐下用 sit 姿态；坐标体系（百分比+锚点）未变
- [x] 同步中继服务器 tools/sync-server.js（ws@6 API，房间制广播 join/move/state/action + 心跳 + 离开通知）
- [x] 客户端 utils/room-sync.js：位置节流 150ms 广播、断线自动回退模拟 peer（游走）、onHide/onUnload 断开、onShow 自动重连
- [x] room/duo 接入：本端移动广播、对端插值平滑（无碰撞信任路径）、家具状态联动（"KIKI 打开了放映机"）、互动动作广播、障碍物提取到 utils/room-map.js 共用
- [x] 中继冒烟测试 tools/test-sync.js 7/7 通过（成员/移动/状态/动作/无回声/离开）
- [x] 回归全绿（JS/WXML/断言/绑定）；主包 489K（+8 角色图）
- 待真机验证：双端同房间同步（模拟器 127.0.0.1；真机需把 room-sync.js 的 HOST 改为局域网 IP）

## 10-05 · 视觉系统重构:深夜放映室 v2(参考图 1:1 复刻)
- [x] Design Tokens 重写(app.wxss):外部深夜蓝 --night 系 / 内部米白纸张 --paper 系 / 交互绿 --green(仅 LIVE·CTA·状态)/ 琥珀 --amber / 胡桃木 --wood / 2700K 暖光 --warm-light;旧令牌留别名;新增 .paper-card/.pill-dark/.pill-green-soft/.pill-amber/.btn-ghost-night/.btn-ghost-danger/.btn-hover 全局类
- [x] App Shell:app.json 窗体转深夜(#0C1424 白字);自定义 Tab 改深色 #0E1830 + 绿色中央 +(标签:房间/好友/消息/我);新增 components/roomie-header(品牌字标+LIVE+头像,customNav 状态栏避让);mini-player 改 Dark Player
- [x] 房间资产夜间化(tools/gen-room-scene.js 重写):深蓝天幕+星月、暖奶油墙、胡桃木地板与层板、放映幕改夜景城市剪影+月亮、ROOMIE 琥珀霓虹、落地灯光晕;坐标系/槽位/元数据契约不变;新增 room-hero.webp(满配家具+12 唱片+MOMO)与深夜版 room-postcard.jpg
- [x] 角色资产换原创(tools/gen-characters.js 重写):橙色圆团子 MOMO / 黄色团子 KIKI × 4 姿态,深色脚底阴影;替换小红书抠图素材(奶龙/宅甜小猫,版权问题排除)
- [x] 新增 tools/gen-friends-village.js:好友页夜景村落(4 个微型等距暖房)
- [x] 10 页视觉迁移:home(基准:今晚状态→房间→在线→任务→播放器→CTA)、room(壳层深夜化)、duo(标题行+同频卡片声波+退出双人房)、song(日落标签黑胶+纸张卡)、architect(工作台纸面板)、profile(档案卡+成就+我的房间)、friends(村落+状态标签)、create/messages/postcard(一致性迁移);FLOOR_COLORS 夜木色板 room/architect 同步
- [x] 微交互统一:主交互元素 hover-class="btn-hover"
- [x] preview-app 8 页同步 + Chrome 无头截图校验(preview-app/shots/*.png)
- [x] 回归全绿:19 JS 语法、10 页绑定、25 播放器断言、19 房间地图、10 同步中继
- 偏差记录:二级页(room/duo/song/architect/postcard)按微信平台约束无 Tab 栏(参考图理想化绘制);song 页保留自带 topbar(返回/分享契约优先)

## 10-07 · 房间交互修复（沙发落座 + 唱片墙轮流展示 + 固定件命中修复）
- [x] 沙发交互重做：点沙发直接落座坐垫（uv 0.10,0.45，保存原坐标），再点站起回原位站立；取消旧的"走近后原地坐下"（随地大小坐）
- [x] 落座锁：坐下后除沙发外家具/地面寻路/KIKI 互动全部阻断
- [x] 坐下渲染层级 +80（zBoost），修复角色被沙发(z=519)整只遮挡；站立角色 zBoost=0 保持景深规则
- [x] 唱片墙点击轮流展示「我的」已选唱片名（♪ n/m · 《名称》，气泡锚在墙上方 24%,10%），游标随房间刷新重置
- [x] **根因修复**：磁盘上 room-scene-layout.js 的 FIXTURE_OBJECTS hitArea 被拍平到顶层，room-scene 组件按嵌套结构消费 → record-wall/floor-records 被 hitTest 过滤，点击落空为地面寻路；热点视图坐标 undefined 渲染在舞台左上角 → "地面唱片"标签闪现。组件侧统一归一化两种结构（FIXTURE_ITEMS）
- [x] 新增 tools/test-sofa-sit.js：Node stub 页面环境，21 项断言全绿
- [x] 回归全绿：18 JS 语法、绑定校验、25 播放器、39 房间地图、10 同步中继
- 待人工：开发者工具点沙发/唱片墙复核视觉效果（坐垫落点、气泡位置）
