# Profile 页 Visual Reference Spec — Phase 4C

> 用途：Profile（我的放映室）验收基准书。依据：`docs/design/ROOMIE-VISUAL-DESIGN-SPEC.md` §7.6、`docs/design/ROOMIE-VISUAL-ASSET-RESET-SPEC.md` §15.6、Room Master 系统。
> 基准图：`reference-assets/ui-reference/profile.png`（由本 spec + Master 资产合成）。

## 概念

「我的私人放映室档案。」——一个真实音乐爱好者的房间档案，不是账户设置页。

## Visual anchor（一级锚点，唯一）

**Personal Room Hero**：我的房间 vignette（Master 派生，MOMO 站在房间里）+ 角色身份浮层。
- Hero 占首屏 ~34–38%，满出血。
- MOMO 在房间中自然站立（原生尺寸，非放大 sprite）。
- 身份以浮层 pills 承载（名字 / Lv / 建筑师徽章），不是大头像圆卡。

## Layout（375pt 基准）

| 区域 | 占比 | 内容 |
| --- | --- | --- |
| Header | ~8% | roomie-header（房间名 · ROOM ID） |
| 刊头 | ~6% | 我的放映室 / My Room + 设置 |
| Personal Room Hero | ~34% | Master vignette + 身份浮层（MOMO · Lv.7 · 建筑师 / ROOM 0731 · 深夜放映室） |
| 唱片收藏 | ~34% | 米白纸卡：收藏标题 + 已选 N/12 + 24 张方形封面网格（选中绿勾）+ 保存按钮 |
| 成就 + 房间档案 | ~12% | 成就行（3 徽章）+ 房间状态行（地板/色温/家具数 + 进入房间） |
| 次级入口 | 余量 | 换发型/换服装（占位反馈） |

## 资产

| 资产 | 来源 |
| --- | --- |
| `vignette-momo.webp` | Master 派生（gen-friends-vignettes.js，MOMO 原生站位） |
| `cover-<id>.webp` ×24 | 方形收藏封面（gen-record-covers.js，6 款几何 × 24 色，与 song 封套画芯同源） |

## Typography

- 刊头 `--fs-title`；Hero 内名字 40rpx/700；章节题 `--fs-section`；正文/说明 `--fs-caption` ink-500；不引入新字体。

## Color / Material

- 深夜壳 + 米白档案卡；绿色只给选中态/保存/进入；琥珀给徽章与 Lv。
- 档案感来自纸张卡 + 唱片封套网格 + 徽章，不做复古滤镜。

## Interaction（契约不变）

- 点选唱片：≤12，超限 toast；0 张显示引导空态；保存写 `roomie_records`；读取过滤无效 ID。
- Hero 点按 → 进入房间页。
- 换发型/换服装：占位 toast（既有行为）。

## 禁止

普通头像圆卡、SaaS Dashboard、大面积渐变、毛玻璃、用户信息文字成为最大视觉元素、重画房间。
