# Roomie 文档索引

## Architecture（架构）

| 文档 | 内容 |
|---|---|
| [architecture/PLATFORM-BOUNDARIES.md](architecture/PLATFORM-BOUNDARIES.md) | 平台边界：小程序 vs Web 的技术/音频/存储/部署差异，"共享逻辑 ≠ 共享运行时文件" |
| [architecture/ROOMIE-ARCHITECTURE.md](architecture/ROOMIE-ARCHITECTURE.md) | 全栈技术地图：小程序 + Web Demo 双运行时、共享逻辑同步机制、适配层、ASCII 架构图 |
| [architecture/ROOMIE-ROOM-SCENE.md](architecture/ROOMIE-ROOM-SCENE.md) | Room Master 场景系统：L0–L7 灯光层、家具元数据、bounds/hitArea/collision 三域分离、A* 寻路、角色景深 |
| [architecture/ROOMIE-STATE.md](architecture/ROOMIE-STATE.md) | 状态架构：Player 单例、roomie_room / roomie_records、好友、形象槽位；Architect 的 saved→draft→save 闭环 |
| [architecture/ROOMIE-SYNC.md](architecture/ROOMIE-SYNC.md) | 房间同步协议：simPeer 模拟对端（Web 默认）、可选 WebSocket 模式、消息协议、2.5s 容差、last-write-wins |
| [architecture/ROOMIE-SOURCE-OF-TRUTH.md](architecture/ROOMIE-SOURCE-OF-TRUTH.md) | 单一数据源与机械同步：5 个共享文件、sync-shared.mjs、漂移检查 |

## Product（产品）

| 文档 | 内容 |
|---|---|
| [product/ROOMIE-DEVELOPMENT-MANUAL.md](product/ROOMIE-DEVELOPMENT-MANUAL.md) | 开发手册：工程约定、文档分工、验收纪律 |
| [product/ROOMIE-MINIPROGRAM-SPEC.md](product/ROOMIE-MINIPROGRAM-SPEC.md) | 小程序产品规格（页面/交互/验收清单 A1–A13） |

## Design（设计）

| 文档 | 内容 |
|---|---|
| [design/ROOMIE-VISUAL-DESIGN-SPEC.md](design/ROOMIE-VISUAL-DESIGN-SPEC.md) | 视觉设计规格（Master Tokens、材质、页面视觉） |
| [design/ROOMIE-VISUAL-ASSET-RESET-SPEC.md](design/ROOMIE-VISUAL-ASSET-RESET-SPEC.md) | 视觉资产重置规格（Room Master 生成管线） |
| [design/ROOMIE-VISUAL-GAP-ANALYSIS.md](design/ROOMIE-VISUAL-GAP-ANALYSIS.md) | 视觉差距分析（审计结论） |
| [design/ROOMIE-LEGACY-MIGRATION.md](design/ROOMIE-LEGACY-MIGRATION.md) | 旧资产迁移说明 |

## Web（Web Demo）

| 文档 | 内容 |
|---|---|
| [web/WEB-DEMO-AUDIT.md](web/WEB-DEMO-AUDIT.md) | Web Demo 代码审计（Phase-1 审计：可复用/重构/废弃总表） |

## Audio（音频）

| 文档 | 内容 |
|---|---|
| [audio/AUDIO-CATALOG.md](audio/AUDIO-CATALOG.md) | 音频目录与许可核查（文件/SHA-256/大小/licenseStatus；当前仅 1 首真实音频） |
| [audio/ROOMIE-REAL-AUDIO-PLAYBOOK.md](audio/ROOMIE-REAL-AUDIO-PLAYBOOK.md) | 真实音频接入与复现手册（寻址方案/踩坑记录） |

## Project（项目管理）

| 文档 | 内容 |
|---|---|
| [project/PLAN.md](project/PLAN.md) | 交付节奏与每日验收 |
| [project/PROGRESS.md](project/PROGRESS.md) | 实际完成项、风险与阻塞记录 |
| [project/ROOMIE-PHASE-0-PLAN.md](project/ROOMIE-PHASE-0-PLAN.md) | Phase 0 计划（视觉重置前） |

## Release（发布）

| 文档 | 内容 |
|---|---|
| [release/ROOMIE-RELEASE-CANDIDATE.md](release/ROOMIE-RELEASE-CANDIDATE.md) | 小程序 RC 验收报告 |

## Competition（比赛）

| 文档 | 内容 |
|---|---|
| [competition/DEMO-SCRIPT.md](competition/DEMO-SCRIPT.md) | 3 分钟演示讲稿/录屏脚本 |
| [competition/SUBMISSION.md](competition/SUBMISSION.md) | 提交检查表（硬性要求/评分维度映射/版权合规） |
