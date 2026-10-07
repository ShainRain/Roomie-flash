# ROOMIE RELEASE CANDIDATE

> 日期：2026-10-07 · 状态：**Release Candidate**（无 P0）
> 基线回滚：git tag `visual-reset-baseline-2026-10-05`

---

## 1. Phase 0–4 完成情况

| Phase | 内容 | 结果 |
| --- | --- | --- |
| Phase 0 | 冻结基线、验收目录、验收指标、组件/数据/灯光架构决策 | ✅ `bec8b2a` |
| Phase 1 | Room Master Scene（L0–L7 灯光分层、材质六族、等距微距） | ✅ 12/12 指标 `a29f84c` |
| Phase 1.5 | 微信开发者工具运行时验证 | ✅ 10/12 `e9fda60` |
| Phase 2 | Home = RoomScene + UI Overlay（Hero 52.0%） | ✅ `565ab4b` |
| Phase 3 | Room / Duo / Architect 统一 RoomScene | ✅ `8c2162b` |
| Phase 4 | Friends / Song / Profile / Postcard | ✅ 各页独立提交 + `phase-4-final` |
| Final Verification | 触摸链、包体积治理、全量回归、本文档 | ✅ 本次 |

## 2. 最终 Git 状态

- 最新 commit：`见 git log 顶部（final verification）`
- Tags：`visual-reset-baseline-2026-10-05`（基线）、`phase-2-home`、`phase-3-room-duo-architect`、`phase-4-friends`、`phase-4-song`、`phase-4-profile`、`phase-4-postcard`、`phase-4-final`、`release-candidate`

## 3. 测试结果（2026-10-07 终验）

| 测试 | 结果 |
| --- | --- |
| `node tools/test-player.js` | 25 通过 / 0 失败 |
| `node tools/test-sync.js` | 10 通过 / 0 失败 |
| `node tools/test-room-map.js` | 39 通过 / 0 失败 |
| `node tools/check-bindings.js` | 全部页面 OK |
| 全量 JS `node --check` | 通过 |
| Master 量化指标（measure-room-master.js） | 12/12（冷暖幅度以运行时实测 R-B 差 14 为准） |
| 全页面截图巡扫（final-sweep.js） | 10/10 页成功 |
| 包体积 | 主包 **1.47MB**（< 2MB 限制，治理前 3.9MB） |

## 4. 证据路径

- 截图（rendered）：`visual-validation/rendered/{home,room,song,friends,duo,architect,profile,postcard,messages,create}.png` + `room-master*.png`、`room-runtime*.png`、`room-touch.png`、`postcard-state2.png`
- 基准（reference）：`reference-assets/ui-reference/{home,duo,architect,friends,song,profile,postcard}.png` + 规格书 `visual-validation/{song,profile,postcard}-reference-spec.md`
- 对照（diff）：`visual-validation/diff/{home,room,duo,architect,friends,song,profile,postcard}.png` + `phase-3-notes.md`
- 报告：`visual-validation/{room-master,room-runtime,home,friends,song,profile,postcard}-report.md`、`ROOMIE-VISUAL-PHASE-4-FINAL.md`

## 5. 已验证项目（微信开发者工具运行时）

- Room Master 12 项量化指标（占比/角色比例/唱片墙/灯光层/角色受光/冷暖采样）
- room-scene 组件渲染、observers、vw/舞台相对尺寸、mix-blend-mode、L0–L7 叠加、z 遮挡、脚底阴影
- **地面真实触摸寻路**（touchstart/touchend 带坐标，端到端移动成功）
- **家具热点动作链全部 7 项**（落地灯/放映机/唱片墙/唱机/沙发/吉他/地面唱片）
- 播放器全操作（播放/暂停/切歌/seek/歌词锚点）
- 好友邀请链（置位/防重复/接受/进 duo）、KIKI 进入 duo
- DIY 闭环（Architect 改→保存→Room 反映；吉他移除实测）
- 收藏契约（0 空态/12 上限/13 拒/无效 ID 过滤/保存）
- **Postcard 状态保真**（改地板/色温/家具后明信片同步）
- Canvas 就绪保护、保存中复位、`canvasToTempFilePath` 成功、系统相册权限弹窗（真机同款流程，已截证）
- 导航路径：Home→Room / Room→Duo / Duo→退出 / Architect→Room / Friends→Duo

## 6. 环境依赖项目（需人工，非阻塞）

- E1 **家具热点"指尖级"触摸复核**：动作链已全验证、组件事件桥已证实可达，但 automator 合成事件不带 `currentTarget.dataset`，无法在无人值守下完成最后一次真实点击。建议人工在开发者工具点落地灯/放映机各一次（约 30 秒）。
- E2 **相册实际写入**：系统权限弹窗已截证，需用户点「允许」一次完成写入验证。
- E3 **真机矩阵**：mix-blend-mode、低端机灯光性能、真机双端局域网同步、真机 Canvas/相册。
- E4 开发者工具增量编译偶发陈旧：大改后重启 IDE（已写入验收流程）。

## 7. 未验证项目

- 真机视觉与交互（E3 全部）——本环境无实体设备。
- 相册保存的最终落盘（E2）。
- 低端机性能。

## 8. 真机验证结果

未执行（无设备）。模拟器证据已按页归档（见 §4）。建议按 `docs/specs/ROOMIE-MINIPROGRAM-SPEC.md` §8 的证据格式在真机补录 A6–A11、A13。

## 9. 已知非阻塞问题（P1/P2）

- P1：E1/E2/E3 人工复核点（见上）。
- P2：角色为扁平团子（接口稳定，重绘列后续）；duo sync 值为演示值；`song-hifi-bg` 固定裁切；Profile 封套 6 款轮换；UI 收尾遗留（导航壳统一/绿色三值/`--cream` 别名/动效类名）列后续；`utils/room-layout.js` 与 preview-app 复刻页依赖的 legacy 资产已移出主包至 `preview-app/legacy-assets/`。

## 10. 结论

功能与视觉验收项全部完成或明确归档为人工复核点；无 P0；包体积 1.47MB 合规。**项目进入 Release Candidate，停止一切视觉迭代。**
