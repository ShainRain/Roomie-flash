# Roomie · 深夜放映室

**Meet your people through music & films.** 以音乐和电影为媒介的"同频陪伴"轻社交产品——每个人都有一间可 DIY 的等距 2.5D 虚拟放映室，邀请好友不是发消息，而是"来我家坐坐"。（腾讯音乐首届高校 AI 黑客松参赛作品 · 赛道二）

## Runtime（两个运行时）

- **📱 Mini Program（`miniprogram/`）**：微信开发者工具导入仓库根目录即可运行（测试号 AppID，无网络依赖，全 mock 本地运行；真实音频首次运行前执行一次 `tools\sync-audio.bat`）
- **🌐 Web Demo（`preview-app/`）**：Vite + 原生 HTML/CSS/JS（无框架）。`cd preview-app && npm install && npm run preview`，默认 `http://localhost:4173/`，无需账号/后端/配置

## Architecture

房间场景系统（L0–L7 灯光层 / 家具三域分离 / A* 寻路 / 角色景深）、状态与持久化、同步协议、双端单一数据源与平台边界 → [docs/architecture/](docs/README.md#architecture架构)

## Audio

- **真实音频（3 首，CC0 1.0 已核验）**：`preview-app/public/audio/`（Ondrosik — Peaceful / Seen from the Unseen / Waves of Longing，源自 Free Music Archive 原始曲目页，逐曲核对许可声明）。Web 经 HTMLAudioElement 直接播放。
- **历史**：此前的 Aruarian_Dance 音源（许可无法核验）已从 Web 运行时删除（git rm；历史提交可能仍含该文件，未改写历史）。
- 歌单顺序 FIXED（append-only）；目录与许可核查 → [docs/audio/AUDIO-CATALOG.md](docs/audio/AUDIO-CATALOG.md)

## Documentation

完整索引 → [docs/README.md](docs/README.md)

## Competition

3 分钟演示讲稿 → [docs/competition/DEMO-SCRIPT.md](docs/competition/DEMO-SCRIPT.md)；提交检查表 → [docs/competition/SUBMISSION.md](docs/competition/SUBMISSION.md)。

## Validation

```bash
cd preview-app && npm test    # 共享文件漂移检查 + player 30 断言 + room-map 39 断言
npm run build                 # 生产构建
```
