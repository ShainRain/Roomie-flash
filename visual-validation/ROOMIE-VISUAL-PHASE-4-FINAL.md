# ROOMIE 视觉资产重置 — Phase 4 总验收文档

> 日期：2026-10-07 · 范围：Room Master → Home → Room → Duo → Architect → Friends → Song → Profile → Postcard 全链路视觉重置
> 基线：git tag `visual-reset-baseline-2026-10-05`（可回滚）

---

## 1. 视觉完成情况（9 个对象）

| 对象 | 状态 | 提交 | 报告 |
| --- | --- | --- | --- |
| Room Master Scene | ✅ 12/12 量化指标通过 | `a29f84c` | `visual-validation/room-master-report.md` |
| Runtime 验证（Phase 1.5） | ✅ 10/12 已验证，2 项环境依赖 | `e9fda60` | `visual-validation/room-runtime-report.md` |
| Home | ✅ Hero 房间占屏 52.0% | `565ab4b` | `visual-validation/home-report.md` |
| Room | ✅ Master 场景 + 交互回归 | Phase 1/3 | 同上 + `diff/phase-3-notes.md` |
| Duo | ✅ 同一 RoomScene，恢复灯光/地板/热点 | `8c2162b` | `diff/phase-3-notes.md` |
| Architect | ✅ 同一 RoomScene + 真实家具缩略图 + 几何修复 | `8c2162b` | `diff/phase-3-notes.md` |
| Friends | ✅ Master 派生 mini-room vignette | `9ee625a` | `visual-validation/friends-report.md` |
| Song | ✅ "从房间取出唱片"（真实资产） | `0197d7d` | `visual-validation/song-report.md` |
| Profile | ✅ 个人房间档案（Hero = Master vignette） | `b6b6d4a` | `visual-validation/profile-report.md` |
| Postcard | ✅ 实体明信片（Canvas 实时合成当前房间） | 本次 | `visual-validation/postcard-report.md` |

**P0：全部为零。**

## 2. Master Asset 使用情况（单一视觉真源）

生成管线（全部原创程序化资产，无版权素材）：

| 管线 | 产物 | 消费方 |
| --- | --- | --- |
| `tools/gen-room-master.js` | L0–L7 灯光层、14 家具覆盖层、24 唱片板材、`room-scene-layout.js`（几何/碰撞/槽位/缩略图） | room-scene 组件（Home/Room/Duo/Architect） |
| `tools/lib-scene-compose.js` | 离线图层合成库（与组件同规则） | render-room-master / vignettes / postcard 层 |
| `tools/gen-friends-vignettes.js` | `vignette-{momo,kiki,nana,abo,rita,tao}.webp` | Friends 横排 / Profile Hero |
| `tools/gen-song-assets.js` | `song-hifi-bg` / `song-sleeve-*` ×3 / `song-disc` | Song Hero |
| `tools/gen-record-covers.js` | `cover-*.webp` ×24 方形收藏封面 | Profile 唱片墙 |
| `tools/gen-postcard-layers.js` | `pc/` 画布安全层 ×44（JPG/PNG） | Postcard Canvas 实时合成 |

**没有任何页面重画房间或家具。** furn-icon-* 双色 icon 已零引用。

## 3. Design System 使用情况

- 令牌：`app.wxss` 颜色/字号/间距/圆角/阴影全页面消费；绿色仅用于 LIVE/在线/同步/主 CTA/正向确认。
- 组件：`room-scene`（4 页）、`roomie-header`（5 页）、`mini-player`（3 页）、custom-tab-bar。
- 光源：统一 L0–L7 层叠（运行时 mix-blend screen；离线 sharp 镜像）。
- 角色：统一 144×184 四姿态接口、舞台相对 % 尺寸、depthFor 景深、精确脚底锚定。

## 4. References（全部 Master 派生，非实现反推）

`reference-assets/ui-reference/`：`home.png` `duo.png` `architect.png` `friends.png` `song.png` `profile.png` `postcard.png`
规格书：`visual-validation/{song,profile,postcard}-reference-spec.md`

## 5. Screenshots & Diffs

- rendered：`visual-validation/rendered/{home,room,duo,architect,friends,song,profile,postcard}.png` + `room-master*.png` + `room-runtime*.png` + `postcard-state2.png`（改房后）
- diff：`visual-validation/diff/{home,room,duo,architect,friends,song,profile,postcard}.png`（reference vs rendered 并排）

## 6. P1 / P2 汇总

**P1（建议后续处理，不阻塞）：**
1. room-scene 运行时 touch 链路（automator 合成事件无 detail）需人工点按复核一次（地面移动/家具热点/hero 跳转/duo 互动）。
2. 真机验证：mix-blend-mode 与灯光性能（低端机）、相册保存、真机双端同步。

**P2：**
- 角色精灵仍是扁平团子（接口稳定，重绘列后续）；玻璃材质面积小。
- duo 的 sync 数值为演示值（既有行为）。
- `pc/` 层增包体 ~1.9MB；Profile 封套设计 6 款轮换；`song-hifi-bg` 为固定裁切。
- UI 收尾遗留：song/postcard 导航壳未统一、绿色有三个近似值、`--cream` 错误别名、动效类名两套（列 Phase 5）。
- 旧资产（room-interactive.webp / room-hero.webp / friends-village.webp / rec-*.webp / room-postcard.jpg）小程序页面已零引用，仅 preview-app 复刻页在用，清理待决策。

## 7. 已知环境依赖

- E1：automator 触摸合成限制（见 P1-1）。
- E2：真机矩阵未跑。
- 相册写入：系统权限弹窗已截证（模拟器），实际写入需用户授权。
- 开发者工具增量编译偶发陈旧：大改后建议重启 IDE（已写入验收流程）。

## 8. 最终测试结果（2026-10-07）

| 测试 | 结果 |
| --- | --- |
| `node tools/test-player.js` | 25 通过 / 0 失败 |
| `node tools/test-sync.js` | 10 通过 / 0 失败 |
| `node tools/test-room-map.js` | 39 通过 / 0 失败 |
| `node tools/check-bindings.js` | 全部页面 OK |
| 全量 JS `node --check` | 通过 |
| Master 量化指标（measure-room-master） | 12/12（冷却幅度以运行时实测 R-B 差 14 为准） |

**功能闭环实测**：Home→Room / Room→Duo / Duo→退出 / Architect→保存→Room / Friends→邀请→Duo / Architect 改房→Postcard 同步。

## 9. 视觉判断（RESET-SPEC §34）

1. 删掉 Logo/按钮/文案：房间仍是可识别的深夜音乐空间——成立（Master 满屋材质、收藏墙、暖光、角色居住感）。
2. 删掉房间只剩 UI：各页立即退回普通 App——成立（房间是所有页面的第一视觉主体）。

**Phase 4 结束。等待人工总验收。**
