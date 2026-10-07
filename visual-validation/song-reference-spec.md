# Song 页 Visual Reference Spec — Phase 4B

> 用途：Song 页验收基准书。依据：`docs/ROOMIE-VISUAL-DESIGN-SPEC.md` §7.3、`docs/ROOMIE-VISUAL-ASSET-RESET-SPEC.md` §15.3、Room Master 材质系统。
> 基准图：`reference-assets/ui-reference/song.png`（由本 spec + Master 资产生成，非实现反推）。

## 概念

「从 Roomie 的房间里拿起一张唱片。」——Vintage Hi-Fi listening room 的一角，而不是流媒体皮肤。

## Visual anchor（唯一绝对锚点）

**当前唱片组合**：封套（sleeve）+ 抽出的黑胶（vinyl disc）。
- 唱片组合占首屏高度 ~38–44%，水平居中偏左。
- 页面内不允许第二个同等视觉重量的元素（刊头/控制/歌词均为次级）。

## Layout（375pt 基准，自上而下）

| 区域 | 高度占比 | 内容 |
| --- | --- | --- |
| 顶栏 | ~8% | 返回 / Roomie · 从放映室取出一张唱片 / 分享 |
| Hero 环境 | ~42% | Hi-Fi 背景（Master 唱机柜局部同源裁切，暖光），封套斜放 + 黑胶叠前，播放时黑胶缓慢旋转 |
| 歌曲身份卡 | ~14% | 米白纸卡：Now Spinning / 曲名 / 艺人 · 收藏来源 / 收藏 pill |
| 进度 + 控制 | ~12% | 进度条（绿）+ 五键传输（中央绿色播放钮） |
| 歌词/评论 | 剩余 | 分段切换，纸面排版 |

## 资产需求（全部 Master 管线原创生成，无版权素材）

| 资产 | 来源 | 规格 |
| --- | --- | --- |
| `song-hifi-bg.webp` | Master 合成场景唱机柜区域裁切（同源材质：胡桃木/黑胶/暖光） | 828×560 |
| `song-sleeve-<track>.webp` ×3 | 几何封套（6 种设计轮换，底色取 records.js 对应唱片色），纸张纹理 + 磨损边 + 书脊 | 600×600 |
| `song-disc.webp` | 黑胶：同心纹 + 弧形高光 + 琥珀中心 label（透明底，供 CSS 旋转） | 560×560 |

## Typography

- 曲名：`--fs-display`（44rpx）700 墨色
- 艺人/来源：`--fs-caption` ink-500
- kicker：en-serif 小号
- 歌词：正文 15–16px 级；当前行墨色 700，非当前行 ink-500
- 不引入新字体族

## Color

- 深夜壳（night-950→900）+ 米白纸卡；绿色只给播放键/进度/收藏态；琥珀给 label 与 kicker 强调。
- Hero 内暖光（2700K 语言），背景带夜色冷边。

## Spacing / Radius / Shadow

- 页边距 40rpx；纸卡圆角 `--r-card-lg`；阴影 `--shadow-paper`；唱片接触阴影柔和、方向与 Master 主光一致（左上→右下）。

## Interaction

- 播放/暂停：黑胶 6s/圈匀速旋转（仅播放时），封套不动；播放键图标切换。
- 切歌：封套与 label 更换为对应曲目（3 张 mock 封套）。
- seek：slider 拖动预览、松手提交（现有逻辑保留）。
- 歌词：scroll-into-view 跟随 `lyricIndex`（现有逻辑保留）。
- 评论 tab：mock 评论列表（现有逻辑保留）。

## 禁止

- 纯黑圆 + 白线的"假黑胶"；大面积毛玻璃/霓虹/发光字；真实版权封面；第二套播放器状态机；把整个 Room Master 缩小塞进页面。
