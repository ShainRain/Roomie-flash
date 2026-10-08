import { makeStubPage } from './stub.js';

export default makeStubPage({
  title: '正在播放',
  en: 'NOW PLAYING',
  subtitle: '歌曲详情页（歌词滚动/唱机动效）将在 Phase 3 实现；Player 状态机已驱动 mini-player。',
  note: '音频默认为 mock 定时器状态机；真实音频可经 adapters/audio.js 接入。'
});
