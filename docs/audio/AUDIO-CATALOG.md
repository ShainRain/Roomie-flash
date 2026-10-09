# Roomie 音频目录（AUDIO CATALOG）

> 诚实原则：**纯音乐 ≠ 无版权**。licenseStatus 只在仓库内有实际依据时标
> verified；否则 unverified / pending。

## 文件清单

| ID | 文件 | 标题 | 艺人 | 时长 | 运行时 | License Status | Source | Attribution |
|---|---|---|---|---|---|---|---|---|
| aruarian | `preview-app/public/audio/aruarian-dance.mp3` | Aruarian_Dance | Nujabes | 4:10 (250s) | Web（HTMLAudioElement）+ 小程序（经 sync-audio.bat 进包） | **unverified** | 仓库自带（e040ac2 引入；playbook 记录文件与时长实测） | Nujabes — Aruarian Dance（曲名/艺人据文件名；仓库内**无授权证明**，仅评审演示用） |
| bluehour | —（无文件） | 蓝调时刻 | Roomie 氛围组 | 4:00 (240s) | Web（mock 定时器，无声） | pending（未提供文件） | — | Roomie Demo 占位器乐曲目 |
| mistwindow | —（无文件） | 雾窗 | Roomie 氛围组 | 3:30 (210s) | Web（mock 定时器，无声） | pending（未提供文件） | — | Roomie Demo 占位器乐曲目 |

**当前仓库仅含 1 首真实音频；其余音轨接口已准备（audioAvailable=false / mock）但未提供文件。**

## aruarian-dance.mp3 技术事实

| 项 | 值 |
|---|---|
| SHA-256 | `cc4dd476d76fc60d1fe9c32a2a9fdf7379c4eff2f6e8b5e6564306218bc50973` |
| 大小 | 4,008,369 B |
| 编码 | MP3 128kbps CBR / 48kHz（playbook 实测记录；时长按 大小×8/码率 ≈ 250.3s） |
| 入库路径 | `preview-app/public/audio/aruarian-dance.mp3`（git 跟踪） |
| 进入 Web 构建 | 是（Vite public 静态资产，`/audio/aruarian-dance.mp3`） |
| 进入小程序包 | 经 `tools/sync-audio.bat` 复制到 `miniprogram/assets/audio/`（**不入库**，.gitignore） |
| 历史路径 | 仓库根 `Nujabes - Aruarian Dance.mp3`（e040ac2 → 已迁移至 preview-app/public/audio/） |

## 许可核查记录（2026-10-09）

- `docs/audio/ROOMIE-REAL-AUDIO-PLAYBOOK.md`：记录文件来源约定、时长实测、寻址
  方案——**不含**任何授权/许可声明
- `competition-info/`（规则扫描图）：无音频许可条款的机器可读记录
- 结论：无依据标 verified；按 unverified 处理。如需正式对外发布，先取得授权
  或替换为可验证的合法音源（manifest 已为此预留 licenseStatus 字段）
