/**
 * Web 音轨清单（audio manifest）— Web Demo 唯一音轨数据源。
 *
 * 诚实原则：
 * - 3 首曲目全部为真实音频文件，licenseType CC0-1.0，
 *   licenseStatus=verified 的依据 = 原始 Free Music Archive 曲目页声明
 *   "licensed under a CC0 1.0 Universal License"（逐曲核对，见
 *   docs/audio/AUDIO-CATALOG.md 的 SHA-256 与页面链接）。
 * - 歌单顺序自本版本起 FIXED：未来曲目只能往尾部追加（房间同步 index 语义）。
 */

export const AUDIO_TRACKS = [
  {
    id: 'peaceful',
    title: 'Peaceful',
    artist: 'Ondrosik',
    album: 'No words',
    duration: 121, // 实测 2:01（FMA 曲目页 02:01；320kbps CBR 估算 121.9s，浏览器实测复核）
    src: '/audio/peaceful.mp3',
    audioAvailable: true,
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-sunny.webp',
    licenseType: 'CC0-1.0',
    licenseStatus: 'verified',
    sourceUrl: 'https://freemusicarchive.org/music/Ondrosik/no-words/peaceful-3/',
    attribution: 'Ondrosik — Peaceful (CC0 1.0 Universal, via Free Music Archive)',
    lyrics: [
      { t: 0, text: '（纯音乐 · Instrumental）' },
      { t: 25, text: '00:25 Theme' },
      { t: 65, text: '01:05 Main section' },
      { t: 100, text: '01:40 Outro' }
    ]
  },
  {
    id: 'seen-from-the-unseen',
    title: 'Seen from the Unseen',
    artist: 'Ondrosik',
    album: 'No words',
    duration: 126, // 实测 2:06（FMA 曲目页 02:06；320kbps CBR 估算 126.8s）
    src: '/audio/seen-from-the-unseen.mp3',
    audioAvailable: true,
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-sea.webp',
    licenseType: 'CC0-1.0',
    licenseStatus: 'verified',
    sourceUrl: 'https://freemusicarchive.org/music/Ondrosik/no-words/seen-from-the-unseen/',
    attribution: 'Ondrosik — Seen from the Unseen (CC0 1.0 Universal, via Free Music Archive)',
    lyrics: [
      { t: 0, text: '（纯音乐 · Instrumental）' },
      { t: 26, text: '00:26 Theme' },
      { t: 68, text: '01:08 Main section' },
      { t: 105, text: '01:45 Outro' }
    ]
  },
  {
    id: 'waves-of-longing',
    title: 'Waves of Longing',
    artist: 'Ondrosik',
    album: 'No words',
    duration: 229, // 实测 3:49（FMA 曲目页 03:49；320kbps CBR 估算 229.5s）
    src: '/audio/waves-of-longing.mp3',
    audioAvailable: true,
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-night.webp',
    licenseType: 'CC0-1.0',
    licenseStatus: 'verified',
    sourceUrl: 'https://freemusicarchive.org/music/Ondrosik/no-words/waves-of-longing/',
    attribution: 'Ondrosik — Waves of Longing (CC0 1.0 Universal, via Free Music Archive)',
    lyrics: [
      { t: 0, text: '（纯音乐 · Instrumental）' },
      { t: 40, text: '00:40 Theme' },
      { t: 130, text: '02:10 Main section' },
      { t: 200, text: '03:20 Outro' }
    ]
  }
];

export function trackById(id) {
  return AUDIO_TRACKS.find((t) => t.id === id) || null;
}

export default AUDIO_TRACKS;
