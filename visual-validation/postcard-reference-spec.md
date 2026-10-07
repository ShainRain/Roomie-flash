# Postcard 页 Visual Reference Spec — Phase 4D

> 用途：Postcard 验收基准书。依据：`docs/specs/ROOMIE-MINIPROGRAM-SPEC.md` §4.9、`docs/ROOMIE-VISUAL-DESIGN-SPEC.md` §7.7、`docs/ROOMIE-VISUAL-ASSET-RESET-SPEC.md` §15.7。
> 基准图：`reference-assets/ui-reference/postcard.png`（由本 spec + Master 资产合成）。

## 概念

「一张从 Roomie 世界里寄出去的实体明信片。」——纸 + 墨 + 唱片 + 房间，Printed Artifact，不是网页截图。

## 规格（逻辑坐标，画布 375pt 宽）

- 画布（明信片本体）：约 327×440pt（WXML 中 654×880rpx），微倾斜 -3° 展示。
- 纸张：`#F6EFDD` 米白 + 低幅度纸粒散点（画布内绘制，非滤镜）。
- 外边距：纸内 18pt 统一留白。

## 构图（自上而下）

| 区域 | 占卡高 | 内容 |
| --- | --- | --- |
| 房间主图 | ~58% | **当前真实房间**（roomie_room 状态实时合成：基底 + 地板色 + 色温光层 + 选中家具 + 唱片槽位 + MOMO/KIKI），圆角裁切 |
| 唱片行 | ~9% | 当前唱片墙选择 ≤6 张：封面色块 + 黑胶圆心，居中 |
| Tagline | ~10% | 「有音乐的房间，抵千万句寒暄。」600 15px 墨色，居中 |
| 分隔线 + 页脚 | ~8% | 细线 + 小字：一间安静的放映室 · Roomie · ROOM ID 0731 |
| 邮戳 | 右上 | 同心双环 + 23:59 + ROOMIE POST 弧文（画布内，保存图含） |
| 邮票 | 右上角内 | 虚线框 + 黑胶小圆（画布内） |
| 胶带 | 顶边两角 | 半透明琥珀纸条（画布内） |

## Typography

- tagline：15px 600 `#26221A`
- 页脚：10px `#9A9080`
- 邮戳：en-serif 10–12px 琥珀/墨
- 无大号标题，无 badge/pill 堆叠——明信片必须安静。

## 材质

- 纸：米白 + 散点颗粒 + 圆角
- 房间：Master 同资产（不同源重画禁止）
- 唱片：色块 + 黑胶圆心（不解码封面图，Canvas 稳定路径）
- 不用强复古滤镜；印刷感来自纸粒、虚线邮票、邮戳、胶带。

## 文字服从关系

房间图像 > tagline > ROOM ID/页脚。禁止信息卡化。

## Interaction（契约不变）

- Canvas 未就绪禁止保存（toast）；保存中「保存中…」；失败重试 toast；相册权限弹窗 → `wx.openSetting`。
- 分享：`onShareAppMessage`（房间文案，回首页）。
- Architect 改房间后，Postcard 生成必须反映（floor/lightTemp/furniture/records 全部读存储实时合成）。
