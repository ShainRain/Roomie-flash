---
name: roomie-visual-qa
description: Roomie 视觉回归测试流程。每次视觉修改必须截图、对比 reference、定位差异并迭代。
---

# Roomie Visual QA

## Rule
“代码能跑”不等于“视觉完成”。任何视觉任务都必须经过 screenshot -> compare -> fix -> screenshot。

## Diff order
按以下顺序排查：
1. 构图与空间比例
2. 元素尺寸与位置
3. 图片/资产比例
4. 字体
5. 颜色
6. 阴影/光照
7. 微交互

## Diagnose before editing
如果同一视觉问题连续三轮仍未解决，停止继续堆 CSS，改查：
- 资产是否错误
- 构图是否错误
- 空间结构是否错误
- 技术表示是否不适合

## Required evidence
每次视觉变更至少记录：
- reference 路径
- current screenshot 路径
- 主要差异
- 修改文件
- 功能测试结果

## Functional regression
视觉修改后运行：
- `node tools/test-player.js`
- `node tools/test-room-map.js`
- `node tools/test-sync.js`
- `node tools/check-bindings.js`
- 对 `miniprogram/**/*.js` 执行 `node --check`
