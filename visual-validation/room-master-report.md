# Room Master 验收报告 — Phase 1

> 日期：2026-10-05 · 迭代：4 轮（角色站位 ×2、霓虹移除、L6 裁剪、测量脚本修正）
> 产物：`visual-validation/rendered/room-master.png`（2700K 全开）、`room-master-6000k.png`、`room-master-nol6.png`（受光对照）、`room-master-geometry.json`、`room-master-metrics.json`、`visual-validation/diff/room-master.png`
> 管线：`node tools/gen-room-master.js && node tools/render-room-master.js && node tools/measure-room-master.js && node tools/make-room-master-diff.js`

## 1. 量化指标（12/12 通过）

| 指标 | 实测 | 门槛 | 结果 |
| --- | --- | --- | --- |
| 房间主体占 stage | **75.72%** | ≥75% | PASS |
| MOMO 高度 / 房间可视高度 | **16.9%**（125px / 735px） | 15–22% | PASS |
| KIKI 高度 / 房间可视高度 | **15.5%**（纵深缩放 0.888 后） | 15–22% | PASS |
| 唱片墙 / 左墙可视面积 | **38.3%**（占整墙 25.7%） | 25–40% | PASS |
| 灯光层数量 | **8**（L0 基底 + L1 AO + L2 冷夜 + L3 暖洗 + L4 层板暖边 + L5 灯光池 + L6 角色薄纱 + L7 放映光束） | ≥4 独立可控 | PASS |
| 窗区色相（2700K / 6000K） | **H220 / H220**，RGB(26,31,42) | 冷蓝 185–245 | PASS |
| 落地灯光池色相（2700K） | **H32**，RGB(174,139,98) | 暖 15–50 | PASS |
| 光池暖度差（2700K vs 6000K） | **R−B 差值 +7** | >5 | PASS |
| 角色受光·MOMO 亮度提升（L6） | **+1.7** | >0.8 | PASS |
| 角色受光·KIKI 亮度提升（L6） | **+1.3** | >0.8 | PASS |
| 角色受光·L6 覆盖率 / 色温 | **100% / H31**（暖） | 覆盖>50% 且暖色 | PASS |

## 2. 构图与内容（人工判定）

- **镜头**：等距微距成立——墙顶被镜头有意裁切，用户视角在房间门口，不再是远看地图。
- **大锚点**：唱机 + Hi-Fi 胡桃木柜 ×1（右墙，含黑胶唱盘、金属唱臂、玻璃门唱片格、书架音箱 ×2）。次级锚点：唱片墙（左）、放映墙（右）、沙发。
- **中型元素 ×5**：弧形落地灯、吉他角（音箱+琴架+吉他）、陶盆绿植 ×2、胡桃木茶几、椭圆织物地毯。
- **生活痕迹 ≥4 类**：杂志叠、咖啡杯+热气、桌脚电源线、地面散落黑胶 ×2+封套、猫窝（蜷睡的猫）、布偶兔、挂墙耳机、黄铜圆镜、书列。
- **材质六族**：墙面（哑光散点颗粒）、胡桃木（三面光照渐变+木纹线+边缘高光）、黑胶（同心纹+弧形高光）、金属（唱臂/灯杆/咖啡机镀铬顶，冷色锐利高光）、织物（沙发织纹+搭毯+挂帘褶皱+地毯流苏）、玻璃（柜门斜反光+窗玻璃反光）。
- **遮挡验证**：KIKI 位于沙发靠背正后方（z 477 < 沙发 519），下半身被正确遮挡；MOMO 在地毯前区（z 671）压地毯、被 L6 薄纱罩住。
- **接触阴影**：两名角色脚底椭圆阴影随景深缩放，方向与主光（左上）一致。

## 3. 灯光架构落地

运行时不依赖全屏 CSS 渐变：L2/L3 反向插值实现 2700K↔6000K；L5 随落地灯开关；L7 随放映机开关；L6 常开（随色温/灯衰减）保证角色受光。离线合成器（render-room-master.js）与 room-scene 组件共用同一套 opacity 规则，渲染验证即运行时预期的镜像。

## 4. 工程落地（本轮同步完成）

- `miniprogram/components/room-scene/` 四件套：纯渲染组件，properties/events 按 Phase 0 §7 接口；角色景深/朝向/脚底阴影组件内完成；触点归一化与家具命中经 `tap`/`furnituretap`/`chartap` 上报。
- `miniprogram/utils/room-map.js`：`createMap(geometry, layout)` 工厂，障碍由布局 `collision` 字段构建（旧默认导出行为不变，duo/architect 零改动）；新增导出 `toUV/fromUV`；景深上限收敛 1.05。
- `miniprogram/pages/room/` 已切换到 room-scene + Master 场景：页面只保留寻路/移动/交互状态机/RoomSync/Player 订阅；删掉全屏渐变 tint 与滤镜灯光。
- 测试：test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / check-bindings 全页面 OK / 新增 JS 全部 `node --check` 通过。

## 5. 与 baseline 的主要视觉差异

见 `diff/room-master.png`（左 before 右 after）：

1. 房间从"页面 30% 的小插图"变为充满画框的等距微距空间（占比 ~30% → 75.7%）。
2. 角色从贴纸大小变为空间居民（占比 ~9% → 16.9%），有落地阴影、被沙发遮挡、受暖光。
3. 唱片墙从虚线空槽网格变为 3 层胡桃木层板 + 封套/黑胶/海报/倚靠唱片/平放叠片的收藏墙。
4. 灯光从"全局变亮变暗"变为光源化：落地灯光池、放映光束+幕布画面、层板暖边、窗外冷夜溢光。
5. 材质从单一扁平矢量变为六族可区分材质。
6. 生活痕迹从 0 到 ≥6 类（杂志/咖啡杯/线材/散落黑胶/猫窝/玩偶/耳机）。

## 6. 当前仍未达标 / 遗留项（诚实清单）

1. **room 页运行时未经验证**（依赖环境）：组件 observers、`mix-blend-mode: screen`、`vw` 角色尺寸、触点归一化需开发者工具/真机确认。离线合成镜像只能证明图层规则，不证明运行时渲染。
2. **room（新 Master）与 duo/architect（旧场景）临时视觉分叉**：duo/architect 页面按指令未动，Phase 4 统一切换到 room-scene。同期 room↔duo 的同步坐标百分比分属两套几何，跨页位置语义不一致（Demo 可接受，Phase 4 消除）。
3. **角色精灵仍是扁平团子**，与房间的伪写实材质存在风格差；文件接口（144×184 四姿态）不变，重绘列后续阶段。
4. **玻璃材质面积小**（柜门+窗反光两处），六族中最弱。
5. **preview-app 的 room.html 复刻页仍引用旧资产**，未更新（其它 7 页复刻本阶段按要求不动）。
6. home/friends/song/profile/postcard 仍消费旧 `room-hero.webp` / `rec-*.webp` / `friends-village.webp`，等 Phase 3–5 从 Master 派生替换。
7. 6000K 时室内转冷主要靠 L3 熄灭，冷光增益偏保守（光池暖度差 +7，刚过门槛）；如需更强的"建筑师预览冷光"可在 Phase 4 增强 L2。

## 7. 迭代记录（本轮修正过的问题）

| 轮 | 问题 | 层级判定 | 修法 |
| --- | --- | --- | --- |
| 1 | MOMO 视觉上站在茶几上 | Composition（站位） | 移至 uv(0.68,0.60) 地毯前区 |
| 1 | KIKI 浮在唱片墙前像贴纸 | Composition | 移至沙发靠背正后方，兼作遮挡验证 |
| 2 | ROOMIE 霓虹被画布裁切/与海报、槽位冲突（两轮调位仍拥挤） | Composition → Asset | **移除霓虹**（微距镜头下墙面无干净容纳带；品牌由 UI Header 承担） |
| 3 | L6 薄纱溢出到房外夜景形成幽灵方框 | Lighting | L6 裁剪进地板菱形 |
| 3 | 测量脚本 sharp `stats()` 忽略 extract（全图均值，数值可疑） | 工具 bug | extract→toBuffer→stats |
| 4 | KIKI 角色比例 14.97% 边界 FAIL | Asset | charBaseHeight 124→128 |
| 4 | L6 受光判别式 R−B 对 screen 混合无效 | 工具/指标 | 改亮度提升 + L6 层覆盖率/色相 |

无"连续三轮未解决"遗留项。
