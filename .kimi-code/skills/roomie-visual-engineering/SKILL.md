---
name: roomie-visual-engineering
description: Roomie 视觉工程规范。将 Roomie 的深夜音乐屋、等距微距空间、纸张 UI、胡桃木/黑胶/暖光材质系统转化为可复用的小程序组件和视觉资产，并约束 CSS/资产/空间层级实现。
---

# Roomie Visual Engineering

## Mission
把 Roomie 做成“可以住进去的音乐工作室”，而不是深色 Dashboard 或游戏菜单。

## Required references
先读：
- `docs/ROOMIE-DEVELOPMENT-MANUAL.md`
- `docs/specs/ROOMIE-MINIPROGRAM-SPEC.md`
- `docs/ROOMIE-VISUAL-DESIGN-SPEC.md`
- `docs/ROOMIE-VISUAL-ASSET-RESET-SPEC.md`

## Visual hierarchy
1. 房间空间
2. 光影与材质
3. 角色与家具
4. 关键状态
5. UI 控件

## Room Master
房间使用“等距微距”镜头：两面墙 + 地面，房间占主要视觉面积。人物、家具、唱片墙、放映墙必须处在统一光源、统一 z-index 和统一空间坐标中。

复杂环境不要用大量 CSS 色块伪造；优先使用高质量 WebP/PNG/SVG 资产，代码负责组合、交互、状态、碰撞、遮挡和动画。

## Materials
至少区分墙面、胡桃木、黑胶、金属、织物、玻璃。夜景用冷色，室内以 2700K 暖光为主，绿色只用于 LIVE/在线/同步/主 CTA/正向确认。

## Anti-patterns
禁止：玻璃拟态、过量渐变、过亮绿色发光、平均分布家具、把复杂房间画成 icon、用整张参考图覆盖页面、为了视觉删除功能。

## Component discipline
统一消费 `miniprogram/app.wxss` 的令牌。Header、Paper Card、Status Pill、Player、CTA、TabBar、Isometric Room Frame 必须可复用。

## Functional invariants
不能破坏 Player、RoomSync、RoomMap、角色移动、家具交互、DIY 持久化、唱片墙、明信片和现有路由。
