/**
 * Roomie 全局播放器状态机
 * ESM port of miniprogram/utils/player.js — API identical, logic unchanged.
 *
 * - mock 歌单与模拟走秒（Demo 阶段不接真实音频，规避版权风险）
 * - 页面通过 subscribe() 订阅快照，Player 单例统一管理计时器
 * - 真实音频挂载点见 src/adapters/audio.js（no-op driver seam）
 */

const PLAYLIST = [
  {
    id: 'sunny',
    title: '晴天',
    artist: '周杰伦',
    album: '叶惠美',
    duration: 269,
    lyrics: [
      { t: 0, text: '故事的小黄花 从出生那年就飘着' },
      { t: 26, text: '童年的荡秋千 随记忆一直晃到现在' },
      { t: 52, text: 'Re So So Si Do Si La' },
      { t: 78, text: 'So La Si Si Si Si La Si La So' },
      { t: 104, text: '吹着前奏 望着天空' },
      { t: 130, text: '我想起花瓣 试着掉落' },
      { t: 156, text: '为你翘课的那一天 花落的那一天' },
      { t: 182, text: '教室的那一间 我怎么看不见' },
      { t: 208, text: '消失的下雨天 我好想再淋一遍' },
      { t: 240, text: '（演示间奏）' }
    ]
  },
  {
    id: 'sea',
    title: '花海',
    artist: '周杰伦',
    album: '魔杰座',
    duration: 264,
    lyrics: [
      { t: 0, text: '（演示占位歌词 · Demo 用）' },
      { t: 30, text: '静止了 所有的花开' },
      { t: 60, text: '遥远了 清晰了爱' },
      { t: 120, text: '（演示间奏）' },
      { t: 180, text: '天郁闷 爱却很喜欢' },
      { t: 220, text: '（演示尾奏）' }
    ]
  },
  {
    id: 'night',
    title: '夜曲',
    artist: '周杰伦',
    album: '十一月的萧邦',
    duration: 226,
    lyrics: [
      { t: 0, text: '（演示占位歌词 · Demo 用）' },
      { t: 25, text: '一群嗜血的蚂蚁 被腐肉所吸引' },
      { t: 55, text: '我面无表情 看孤独的风景' },
      { t: 110, text: '（演示间奏）' },
      { t: 170, text: '为你弹奏肖邦的夜曲' },
      { t: 205, text: '（演示尾奏）' }
    ]
  }
];

function fmt(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const state = {
  playing: false,
  index: 0,
  position: 134
};

let timer = null;
const listeners = new Set();

function current() {
  return PLAYLIST[state.index];
}

function activeLyricIndex() {
  const lyrics = current().lyrics;
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (state.position >= lyrics[i].t) idx = i;
  }
  return idx;
}

export function snapshot() {
  const c = current();
  return {
    playing: state.playing,
    index: state.index,
    track: c,
    position: state.position,
    duration: c.duration,
    progress: c.duration ? Math.round((state.position / c.duration) * 1000) / 10 : 0,
    positionText: fmt(state.position),
    durationText: fmt(c.duration),
    lyricIndex: activeLyricIndex(),
    playlistLength: PLAYLIST.length
  };
}

function emit(source) {
  const snap = snapshot();
  listeners.forEach((fn) => {
    try {
      fn(snap, source || 'local');
    } catch (e) {
      console.error('[player] listener error', e);
    }
  });
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function ensureTimer() {
  stopTimer();
  if (!state.playing) return;
  timer = setInterval(() => {
    state.position += 1;
    if (state.position >= current().duration) {
      next();
      return;
    }
    emit();
  }, 1000);
}

export function toggle() {
  state.playing = !state.playing;
  ensureTimer();
  emit();
}

export function play() {
  if (!state.playing) toggle();
}

export function switchTo(index, autoplay) {
  state.index = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  state.position = 0;
  state.playing = !!autoplay;
  ensureTimer();
  emit();
}

export function next() {
  switchTo(state.index + 1, state.playing);
}

export function prev() {
  switchTo(state.index - 1, state.playing);
}

export function seek(percent) {
  state.position = Math.round((percent / 100) * current().duration);
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot(), 'local');
  return () => listeners.delete(fn);
}

// 对端播放状态（room-sync 'player' 消息）：last-write-wins
// 进度误差 ≤2.5s 不校正；playing 时按 sentAt 补偿网络延迟
export function applyRemote(msg) {
  if (!msg || typeof msg !== 'object') return;
  const compensated = typeof msg.position === 'number'
    ? msg.position + (msg.playing && msg.sentAt ? Math.max(0, (Date.now() - msg.sentAt) / 1000) : 0)
    : state.position;
  if (typeof msg.index === 'number' && msg.index !== state.index) {
    state.index = ((msg.index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    state.position = compensated;
  } else if (Math.abs(compensated - state.position) > 2.5) {
    state.position = Math.min(compensated, current().duration);
  }
  if (typeof msg.playing === 'boolean') state.playing = msg.playing;
  ensureTimer();
  emit('remote');
}

export default { subscribe, toggle, play, next, prev, seek, switchTo, applyRemote, snapshot };
