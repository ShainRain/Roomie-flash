# ROOMIE 旧版遗产迁移记录（Roomie-main.zip → 视觉重置版）

> 日期：2026-10-07 · 批准范围：A（播放器同步链路）+ B（avatar 双槽位）+ C（bindings 静态检查）+ D（夜色派生技术存档）+ 恢复亮度维度（lightBright）
> 基线：`release-candidate`（迁移前）

## 逐文件 diff 结论

`room-sync.js` / `sync-server.js` / `test-sync.js` / `player.js` / `records.js` 与旧版逐字节相同，无迁移内容。

## 已迁移

### A. 房间页播放器同步链路（修复新版真实回归）

| 项 | 位置 | 说明 |
| --- | --- | --- |
| `subscribePlayer` 订阅链 | `pages/room/room.js` | 进房订阅、切歌后墙上徽标标题实时刷新（旧版 10-04 修过的"切歌冻结"bug 在新版已复现，现已修复） |
| `broadcastPlayer` 跳变即时报 | 同上 | index/playing 变化或 seek>3s 才广播，走秒不报 |
| `onJoined` 进房广播当前曲目 | 同上 | 后加入者拿到"正在播哪首" |
| `applyPeerPlayer` + `__cache` 防护 | 同上 + `pages/duo/duo.js` | 缓存补发只采纳曲目与播放态，不吞本地进度（duo 原本无防护，一并补上） |
| `onUnload` 退订 | 同上 | 无残余订阅 |
| `tools/test-room-player-sync.js` | 新增 | 19 项契约断言（Node 桩跑 room.js） |

### B. avatar 头像/服装双槽位系统

| 项 | 位置 | 说明 |
| --- | --- | --- |
| `utils/avatar.js` | 迁移（drop-in） | 双槽位、原子换图、系统回收自愈；53 项测试通过 |
| profile 导入流程 | `pages/profile/profile.js` | 相册原图（保透明底）/聊天记录兜底/2MB 校验/权限恢复路径/恢复默认确认；51 项页面级测试通过 |
| `room-scene` 精灵覆盖 | `components/room-scene/index.wxml` | 角色条目支持 `spriteSrc` 覆盖默认精灵 |
| room/duo 接线 | `room.js` / `duo.js` 的 `syncCharacters()` | 导入服装后 MOMO 在房间/双人房显示自定义形象 |
| `tools/test-avatar.js` / `test-profile-avatar.js` | 迁移 | 53 + 51 项断言全绿 |

### C. check-bindings 静态检查

`tools/check-bindings.js` 恢复"WXML `{{ }}` 内不得出现函数调用"规则（选中态静默失效类 bug 的防复发闸门，全页面通过）。

### 亮度维度（lightBright 0–100）

- `app.js normalizeRoom` 白名单恢复 `lightBright`（默认 100，旧缓存向前兼容）。
- `room-scene` 组件新增 `lightBright` 属性与 `.sc-dim` 调光层（0.45–1.0 亮度映射，HUD 不受影响）。
- architect 灯光页新增亮度滑杆（烛光 0 ↔ 全亮 100，拖动实时预览，保存入 `roomie_room`）。
- home / room / duo 全部透传。
- 运行时实测：35% 时场景平均亮度 131→89，room 页同步生效。

### D. 夜色派生技术存档

`tools/archive/gen-home-hero-night.js` + README：recomb 夜色矩阵 + screen 叠光 + joinChannel 还原 alpha，仅作参考存档。

## 明确不迁移（经批准/分析）

- `room-theme.js` 昼夜系统（mode、2000K 下限、CSS 渐变公式）：已被 L0–L7 预渲染灯光层超越；亮度维度已按新架构单独恢复。
- 首页 backdrop/夜间派生资产、`HOME_ART` 映射、`setNavigationBarColor`：与新母版/永久深夜方向不兼容。
- 旧 duo.js（逻辑已全量移植）、messages/create（机制相同）。
- `setFurnitureCollision()` 开关：新版碰撞与 DIY 显隐联动已重写，无对应物。

## 迁移后回归（2026-10-07）

| 测试 | 结果 |
| --- | --- |
| test-player / test-sync / test-room-map | 25✓ / 10✓ / 39✓ |
| test-room-player-sync（新） | 19✓ |
| test-avatar / test-profile-avatar（迁移） | 53✓ / 51✓ |
| check-bindings（含新规则） | 全页面 OK |
| 全量 JS `node --check` | 通过 |
| 全页面截图巡扫 | 10/10（architect 重试后 OK） |

## 遗留

- 换装导入的相册权限弹窗与真实图片导入需真机/人工操作验证（同 E2 类）。
- 自定义服装为静态图片（不走 walk 帧切换，与旧版行为一致）。
