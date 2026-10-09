/**
 * Web 音轨清单（audio manifest）— Web Demo 唯一音轨数据源。
 *
 * 诚实原则：
 * - 当前仓库仅含 1 首真实音频（aruarian-dance.mp3，见 docs/audio/AUDIO-CATALOG.md）。
 * - audioAvailable=false 的曲目没有音频文件：走 mock 定时器（无声），UI 如实标注。
 * - licenseStatus 只取 verified / unverified / pending；仓库内无授权证明一律 unverified。
 */

export const AUDIO_TRACKS = [
  {
    id: 'aruarian',
    title: 'Aruarian_Dance',
    artist: 'Nujabes',
    album: 'Samurai Champloo OST',
    duration: 250, // 4:10，与 preview-app/public/audio/aruarian-dance.mp3 实测一致（128kbps CBR）
    src: '/audio/aruarian-dance.mp3',
    audioAvailable: true,
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-aruarian.webp',
    licenseStatus: 'unverified', // 仓库内无授权证明（playbook 仅记录文件与时长实测）
    source: 'preview-app/public/audio/aruarian-dance.mp3（仓库自带，4,008,369 B）',
    attribution: 'Nujabes — Aruarian Dance（曲名/艺人据文件名与 docs/audio/ROOMIE-REAL-AUDIO-PLAYBOOK.md；仅评审演示用）',
    // 纯音乐：无版权歌词，用结构性段落标签代替歌词行
    lyrics: [
      { t: 0, text: '（纯音乐 · 钢琴与鼓点采样）' },
      { t: 30, text: '♪ Aruarian Dance — Nujabes' },
      { t: 90, text: '（即兴钢琴主题浮现）' },
      { t: 150, text: '♪ 鼓刷与贝斯渐入' },
      { t: 205, text: '（尾奏 · 钢琴渐弱）' }
    ]
  },
  {
    id: 'bluehour',
    title: '蓝调时刻',
    artist: 'Roomie 氛围组',
    album: 'Night Sessions',
    duration: 240,
    src: null,
    audioAvailable: false, // 无音频文件：mock 定时器演示
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-sea.webp',
    licenseStatus: 'pending', // 占位曲目，尚未提供文件
    source: '（未提供音频文件 · mock）',
    attribution: 'Roomie Demo 占位器乐曲目',
    lyrics: [
      { t: 0, text: '（纯音乐 · Instrumental）' },
      { t: 30, text: '00:30 Theme' },
      { t: 120, text: '02:00 Main section' },
      { t: 200, text: '03:20 Outro' }
    ]
  },
  {
    id: 'mistwindow',
    title: '雾窗',
    artist: 'Roomie 氛围组',
    album: 'Night Sessions',
    duration: 210,
    src: null,
    audioAvailable: false, // 无音频文件：mock 定时器演示
    instrumental: true,
    sleeve: '/assets/img/song-sleeve-night.webp',
    licenseStatus: 'pending', // 占位曲目，尚未提供文件
    source: '（未提供音频文件 · mock）',
    attribution: 'Roomie Demo 占位器乐曲目',
    lyrics: [
      { t: 0, text: '（纯音乐 · Instrumental）' },
      { t: 25, text: '00:25 Theme' },
      { t: 110, text: '01:50 Main section' },
      { t: 180, text: '03:00 Outro' }
    ]
  }
];

export function trackById(id) {
  return AUDIO_TRACKS.find((t) => t.id === id) || null;
}

export default AUDIO_TRACKS;
