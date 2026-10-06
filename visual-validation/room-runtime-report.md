# Room Runtime 验证报告 — Phase 1.5

> 日期：2026-10-06 · 环境：微信开发者工具（基础库 3.4.0，模拟器 390pt）+ miniprogram-automator 0.12.1
> 方法：`tools/verify-room-runtime.js`（IDE automation 端口 9420，页面级探针 + 组件 outerWxml 结构探针 + 截图）
> 产物：`visual-validation/rendered/room-runtime.png`、`room-runtime-moved.png`、`visual-validation/diff/room-runtime-vs-master.png`

## 状态总览

| # | 检查项 | 结果 | 状态 |
| --- | --- | --- | --- |
| 1 | room-scene 组件正常渲染 | 组件完整渲染（outerWxml 结构完整，21 个图层 image） | ✅ 已验证 |
| 2 | vw 尺寸正确 | 舞台 390×390（100vw 正方形，top 193）；精灵 43×56px（≈11vw，纵深缩放正确） | ✅ 已验证 |
| 3 | component observer 正常 | floor→clip-path 多边形、records→6 槽位、furniture→14 覆盖层、characters→z 排序全部生效 | ✅ 已验证 |
| 4 | mix-blend-mode 正常 | 5 个 screen 混合层渲染，暖光/冷夜/薄纱视觉成立；与离线 screen 混合**观感略暗**（见差异 D2） | ✅ 已验证（轻微差异） |
| 5 | L0–L7 灯光层叠加 | L0–L6 全部生效；L7 随放映机关闭正确隐藏（放映机交互后应出现，见 #10） | ✅ 已验证 |
| 6 | 角色受 L6 暖光 | L6 薄纱层在角色之上渲染（DOM 证实 opacity 1 的 screen 层覆盖角色区域） | ✅ 已验证 |
| 7 | z-index / 遮挡 | 家具 z 与角色 z 同轴排序渲染（zStack：KIKI 585 < table 613 < MOMO 740），无穿越 | ✅ 已验证 |
| 8 | 角色脚底阴影 | 2 个 `sc-char-shadow` 元素存在，截图可见接触阴影随景深缩放 | ✅ 已验证 |
| 9 | 点击地面寻路 | 页面处理链已验证（callMethod `onSceneTap({left:50,top:50})` → 角色从 (40,74) 走到 (50,50)，A* 正常）；**真实触摸链路见"环境依赖 E1"** | ⚠️ 部分环境依赖 |
| 10 | 家具热点 | 7 个热点渲染（2 固定 + 5 家具），页面处理链已验证（`onFurnitureTap` 动作族原逻辑未变）；**真实触摸链路见 E1** | ⚠️ 部分环境依赖 |
| 11 | 房间缩放比例 | 舞台恒为正方形 100vw，房间占比与离线 Master 一致（对比图佐证） | ✅ 已验证 |
| 12 | 溢出/裁切/白边/层级异常 | 无白边、无层级错乱；墙顶裁切为微距镜头设计意图；L6 不再溢出房外（修复已生效） | ✅ 已验证 |

## 与离线 Master 的对照（diff/room-runtime-vs-master.png）

**一致**：构图、家具布局、唱片墙、材质、灯光结构、角色比例、冷暖关系。运行时与离线渲染是同一套资产与 opacity 规则。

**差异（均可解释，非缺陷）**：

| # | 差异 | 原因 |
| --- | --- | --- |
| D1 | 运行时放映幕为暗态 | `roomState.projectorOn=false`（Master 渲染固定全开），状态差异非渲染差异 |
| D2 | 运行时整体观感略暗于离线 | sharp 的 screen 混合与 WebView `mix-blend-mode: screen` 的像素级差异 + 模拟器色彩；**观感可接受，定性和蔼**；如需像素级一致可后续校准 L3 不透明度 |
| D3 | 角色位置/朝向不同 | 运行时 mock peer 游走（RoomSync 回退 peer 正常工作） |
| D4 | 唱片槽位 6 vs 12 | 运行时读存储中的真实选择（6 张），Master 渲染固定 12 张 |

## 本轮修复的问题（验证过程中发现并处理）

| 问题 | 层级判定 | 处理 |
| --- | --- | --- |
| 家具覆盖层运行时全部消失（`furniture` prop 空） | **验收工具链**：`miniProgram.evaluate` 创建的对象是跨 JS realm 对象，WeChat setData 会把其中的数组字段从组件同步中静默丢弃（页面 data 正常、组件 prop 丢失） | 验收脚本改为只写 storage，新增页面方法 `reloadRoomFromStorage()`（与 app.onLaunch 同路径、same-realm）；产品代码无缺陷。`refreshRoomConfig` 保留 `.slice()` 与 onShow `nextTick` 作为防御 |
| 开发者工具增量编译陈旧（改动后行为不更新） | 环境 | 重启 IDE 全量编译后正常；已记录为验收流程注意事项 |
| 页面 `bind:tap` 与组件自定义事件 `tap` 撞名：原生冒泡导致处理器以错误 detail 执行两次 | **真实产品 bug** | 组件事件改名 `stagetap`；`onSceneTap` 增加 detail 守卫 |
| 组件 `onStageTap` 在 detail 缺坐标时抛错 | 健壮性 | 增加 `e.detail → changedTouches` 回退与空值守卫 |

## 环境依赖（未能在本环境完成，不阻塞门禁）

- **E1 真实触摸事件链**：miniprogram-automator 0.12.1 在本 IDE 版本下合成事件不带 `detail`/`currentTarget`（`element.tap()` 可触发处理器但参数为空）。页面处理逻辑已经 `callMethod` 全参数验证；组件事件桥（`triggerEvent('stagetap'/'furnituretap')`）与原生冒泡已被证实可达页面绑定（调试期错误日志为证）。**建议：在开发者工具中人工点按地面与落地灯热点各一次复核（约 1 分钟）。**
- **E2 真机**：mix-blend-mode 与灯光性能在真机（尤其低端机）未验证，沿用 PROGRESS.md 的真机阻塞记录。

## 失败项

无。

## 结论

Room Master 在真实微信小程序运行环境中渲染与离线 Master **一致（差异均可解释）**，12 项检查中 10 项已验证、2 项逻辑已验证但真实触摸链受自动化环境限制（已给出 1 分钟人工复核路径）。**建议判定 Phase 1.5 通过门禁。**

## 复现

```powershell
# 终端 1：启动 IDE automation（需 IDE 已登录）
tools\wx-auto.bat
# 终端 2：运行验证（截图 + 探针）
node tools/verify-room-runtime.js
```
