# Song 验收报告 — Phase 4B

> 日期：2026-10-07 · 迭代：2 轮（资产落地 → 封套设计修正）· 基准：`reference-assets/ui-reference/song.png`（依据 `visual-validation/song-reference-spec.md`）
> 产物：`visual-validation/rendered/song.png`、`visual-validation/diff/song.png`

## 概念落地

「从 Roomie 的房间里拿起一张唱片。」Hero 不再是纯 CSS 假黑胶，而是 Master 管线的真实资产组合：

- `song-hifi-bg.webp`：Master 唱机柜区域同源裁切（胡桃木柜/黑胶机/音箱/落地灯/挂帘，材质与房间一致）
- `song-sleeve-{sunny,sea,night}.webp` ×3：原创几何封套（纸张纹理/书脊/磨损角/印刷高光/虚构厂牌字），无版权素材
- `song-disc.webp`：同心纹黑胶 + 弧形高光 + 琥珀 ROOMIE label，播放时 6s/圈旋转（仅播放中，克制）

## 门禁检查（10 项）

| 检查 | 结果 |
| --- | --- |
| 唱片唯一视觉锚点 | 封套+黑胶组合占首屏 ~40%，无第二视觉重心 ✓ |
| 唱片真实材质 | 黑胶同心纹+高光、封套纸张+磨损+印刷感 ✓（非黑圆+白线） |
| 房间/Hi-Fi 语言与 Master 一致 | 背景即 Master 唱机柜局部（同源） ✓ |
| UI 不压唱片 | 纸卡从 hero 下缘叠起，身份/控制/歌词均为次级 ✓ |
| 文字层级 | kicker/曲名/艺人/歌词三级清晰 ✓ |
| 播放状态 | 播放→黑胶旋转；暂停→静止 ✓ |
| 歌词可读性 | 纸面排版，当前行绿色加粗、scroll-into-view 跟随 ✓ |
| 页面留白 | 深夜壳自然收边，无堆砌 ✓ |
| 控制区比例 | 五键一行，中央绿钮为唯一高饱和元素 ✓ |
| 动画克制 | 仅 6s 匀速旋转 + 既有入场 rise-in ✓ |

## 功能回归（运行时实测）

播放 ✓ → 歌词行高亮锚点（lyric-5）✓ → seek 50%（135s）✓ → 下一首（花海，封套同步切换 sleeve-sea）✓ → 上一首 ✓ → 暂停 ✓。Player 单例未动，无第二状态机。

test-player 25✓ / test-sync 10✓ / test-room-map 39✓ / check-bindings 全页面 OK。

## P0/P1/P2

- P0：无
- P1：无
- P2：封套几何设计共 6 款轮换，三首 mock 曲目仅用到 3 款（扩充曲目时自然覆盖）；`song-hifi-bg` 为固定裁切（换地板/灯光 DIY 不联动，Demo 可接受）。

## 与 reference 的差异

1. 运行时黑胶比 reference 大 ~10%（锚点更强，接受）。
2. 运行时 hero 背景为 aspectFill 满幅，reference 为等比——内容一致，裁切位置略异。

## 停止条件

未触发（2 轮内收敛）。
