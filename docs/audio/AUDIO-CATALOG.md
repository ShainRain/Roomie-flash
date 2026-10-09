# Roomie 音频目录（AUDIO CATALOG）

> 诚实原则：**纯音乐 ≠ 无版权**。licenseStatus 只在有实际依据时标 verified。
> 本目录 3 首曲目的 CC0 1.0 许可信息**来自对应 Free Music Archive 原始曲目页**
> （逐曲核对页面声明 "licensed under a CC0 1.0 Universal License"）。
> CC0 ≠ 绝对零风险：若曲作者对授权有后续声明，以作者与 FMA 页面为准。

## 文件清单

| ID | 文件 | 标题 | 艺人 | 实测时长 | 运行时 | License | Source URL | Attribution |
|---|---|---|---|---|---|---|---|---|
| peaceful | `preview-app/public/audio/peaceful.mp3` | Peaceful | Ondrosik | 2:01 (121s) | Web（HTMLAudioElement） | **CC0 1.0** · verified | [FMA track page](https://freemusicarchive.org/music/Ondrosik/no-words/peaceful-3/) | Ondrosik — Peaceful (CC0 1.0 Universal, via FMA) |
| seen-from-the-unseen | `preview-app/public/audio/seen-from-the-unseen.mp3` | Seen from the Unseen | Ondrosik | 2:06 (126s) | Web | **CC0 1.0** · verified | [FMA track page](https://freemusicarchive.org/music/Ondrosik/no-words/seen-from-the-unseen/) | Ondrosik — Seen from the Unseen (CC0 1.0 Universal, via FMA) |
| waves-of-longing | `preview-app/public/audio/waves-of-longing.mp3` | Waves of Longing | Ondrosik | 3:49 (229s) | Web | **CC0 1.0** · verified | [FMA track page](https://freemusicarchive.org/music/Ondrosik/no-words/waves-of-longing/) | Ondrosik — Waves of Longing (CC0 1.0 Universal, via FMA) |

三首同属专辑 **No words**（Ondrosik，2026-02-13 发布，Instrumental: Yes，AI generated: No）。
**均不进入小程序包**（enters-miniprogram = no；小程序侧音频方案见 playbook，属另一链路）。

## 技术事实（下载自 files.freemusicarchive.org，各曲目页内嵌 fileUrl）

| 文件 | 大小 | 编码 | SHA-256 |
|---|---|---|---|
| peaceful.mp3 | 4,875,011 B | MP3 320kbps CBR | `ed81b60c3611b1b1d5b00bab7c926e619129e7c2aa6982d8556faffb442b2acc` |
| seen-from-the-unseen.mp3 | 5,073,743 B | MP3 320kbps CBR | `2bb5cd97c822320f00a1010df63781ada971defe3e10b56b19760d0dfc699965` |
| waves-of-longing.mp3 | 9,179,659 B | MP3 320kbps CBR | `acbc6ce4ce4f0a6b786d253845b20d65a6ef057abe808f59f42424d21d1f2229` |

时长核实：FMA 页面标注（02:01 / 02:06 / 03:49）与 CBR 估算（121.9 / 126.8 / 229.5s）
及浏览器实测一致。文件头 MP3 帧同步（0xFFFB），Content-Type: audio/mpeg。
未转码（原始 MP3 直接入库，Chrome/Safari 均原生支持）。

## 许可核查记录

- 2026-10-09：逐曲打开 FMA 原始曲目页，确认页面显示
  "… by Ondrosik is licensed under a CC0 1.0 Universal License"，并从页面内嵌
  fileUrl（files.freemusicarchive.org 官方文件域）下载；核对文件头与 MIME。
- 历史：`aruarian-dance.mp3`（Nujabes，licenseStatus 曾为 unverified）已自
  Web 运行时删除（git rm；注意：历史提交中仍可能含该文件，见
  ROOMIE-REAL-AUDIO-PLAYBOOK.md 顶部更新说明）。
