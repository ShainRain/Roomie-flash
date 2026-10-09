# Roomie · 深夜放映室

**Meet your people through music & films.** 以音乐和电影为媒介的"同频陪伴"轻社交产品——每个人都有一间可 DIY 的等距 2.5D 虚拟放映室，邀请好友不是发消息，而是"来我家坐坐"。（腾讯音乐首届高校 AI 黑客松参赛作品 · 赛道二）

## Project Structure

| 目录 | 内容 |
|---|---|
| `miniprogram/` | 微信小程序（主产品，原生框架） |
| `preview-app/` | Web Demo（Vite + 原生 ESM，评审演示） |
| `tools/` | 资产生成管线（sharp 程序化生成）+ 测试/验证脚本 |
| `docs/` | 全部文档（架构/产品/设计/Web/项目/发布/比赛，索引见 docs/README.md） |
| `figma-assets/` | 设计稿导出资产 |
| `reference-assets/` | UI 视觉回归基准（ui-reference/*.png） |
| `visual-validation/` | 视觉验收报告与渲染产物 |

## Two Runtime Targets

**WeChat Mini Program**（`miniprogram/`）：微信开发者工具导入仓库根目录即可运行（测试号 AppID，无网络依赖，全 mock 本地运行）。

**Web Demo**（`preview-app/`）：Vite + 原生 HTML/CSS/JS（无框架，无后端依赖，mock 播放器 + simPeer 模拟对端）。与小程序共享场景资产与核心逻辑（机械同步，见架构文档）。

## Core Architecture

房间场景系统（L0–L7 灯光层 / 家具三域分离 / A* 寻路 / 角色景深）、状态与持久化、同步协议、双端单一数据源同步机制 → [docs/architecture/](docs/README.md#architecture架构)

## Documentation

完整索引 → [docs/README.md](docs/README.md)

## Run Web Demo

```bash
cd preview-app && npm install && npm run preview
```

默认 `http://localhost:4173/`，无需账号/后端/配置。详见 [preview-app/README.md](preview-app/README.md)。

## Competition Demo

3 分钟演示讲稿 → [docs/competition/DEMO-SCRIPT.md](docs/competition/DEMO-SCRIPT.md)；提交检查表 → [docs/competition/SUBMISSION.md](docs/competition/SUBMISSION.md)。

## Validation

```bash
cd preview-app && npm test    # 共享文件漂移检查 + player 25 断言 + room-map 39 断言
npm run build                 # 生产构建
```
