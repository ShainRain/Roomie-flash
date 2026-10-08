/**
 * Roomie 全局播放器状态机
 * - mock 歌单与模拟走秒（比赛 Demo 阶段不接真实音频，规避版权风险）
 * - Aruarian_Dance 一首接真实音频：wx.createInnerAudioContext 播放工程根目录 mp3
 * - 页面通过 subscribe() 订阅快照，Player 单例统一管理计时器
 * - 歌词行按时间戳高亮，供歌曲详情页使用
 */

// ---- 真实音频寻址约定（重要，迁移勿改）----
// 音源文件《Nujabes - Aruarian Dance.mp3》固定在工程根目录、与 miniprogram/ 同级
//（随工程整体迁移，禁止硬编码绝对盘符路径）。InnerAudioContext.src 不支持相对路径，
// 也无法访问代码包外文件，所以按候选列表依次寻址：
//   1. /assets/audio/aruarian-dance.mp3 —— 包内资源（tools/sync-audio.bat 从同级 mp3 同步进来，首选）
//   2. http://127.0.0.1:8787/...        —— 本地静态服务兜底（tools/serve-audio.bat，需保持运行）
//   3. ../Nujabes - Aruarian Dance.mp3  —— 相对寻址（个别运行环境支持直接读包外文件）
// 全部失败则回退纯模拟走秒，Demo 不断链。
const ARUARIAN_FILE = 'Nujabes - Aruarian Dance.mp3';
const ARUARIAN_SRC_CANDIDATES = [
  '/assets/audio/aruarian-dance.mp3',
  `http://127.0.0.1:8787/${encodeURI(ARUARIAN_FILE)}`,
  `../${ARUARIAN_FILE}`
];

const PLAYLIST = [
  {
    id: 'aruarian',
    title: 'Aruarian_Dance',
    artist: 'Nujabes',
    album: 'Samurai Champloo OST',
    duration: 250, // 4:10，与工程根目录真实 mp3 时长一致
    audio: true,
    lyrics: [
      { t: 0, text: '（纯音乐 · 钢琴与鼓点采样，Departure 原声）' },
      { t: 30, text: '♪ Aruarian Dance — Nujabes' },
      { t: 90, text: '（即兴钢琴主题浮现）' },
      { t: 150, text: '♪ 鼓刷与贝斯渐入' },
      { t: 205, text: '（尾奏 · 钢琴渐弱）' }
    ]
  },
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
  position: 0
};

let timer = null;
const listeners = new Set();

// ---- 真实音频层（仅 audio:true 曲目启用；Node 测试环境无 wx，自动降级纯模拟）----
let audioCtx = null;       // InnerAudioContext 单例（懒创建）
let audioSrcTried = 0;     // 已尝试的寻址候选数
let audioBroken = false;   // 候选全部失败 → 该曲永久回退模拟走秒

function hasWxAudio() {
  return typeof wx !== 'undefined' && typeof wx.createInnerAudioContext === 'function';
}

function currentIsAudio() {
  return !!current().audio;
}

function ensureAudioCtx() {
  if (audioCtx || !hasWxAudio() || audioBroken) return audioCtx;
  audioCtx = wx.createInnerAudioContext();
  audioCtx.src = ARUARIAN_SRC_CANDIDATES[0];
  audioSrcTried = 1;
  // 寻址候选依次回退：记录错误详情，切换 src 后若正处于播放态则重试播放
  audioCtx.onError((err) => {
    console.warn('[player] 音频寻址失败，尝试下一候选:',
      ARUARIAN_SRC_CANDIDATES[audioSrcTried - 1], err && (err.errMsg || err.errCode || err));
    if (audioSrcTried < ARUARIAN_SRC_CANDIDATES.length) {
      audioCtx.src = ARUARIAN_SRC_CANDIDATES[audioSrcTried];
      audioSrcTried += 1;
      if (state.playing) {
        try { audioCtx.play(); } catch (e) { /* 忽略 */ }
      }
    } else {
      audioBroken = true;
      console.warn('[player] 真实音频全部候选加载失败，回退模拟走秒:', ARUARIAN_FILE);
    }
  });
  audioCtx.onEnded(() => next());
  return audioCtx;
}

// 真实音频播放中，进度以音频时钟为准（timeupdate 约 250ms 一次）
function syncPositionFromAudio() {
  if (audioCtx && !audioBroken && typeof audioCtx.currentTime === 'number') {
    state.position = audioCtx.currentTime;
  }
}

function pauseAudio() {
  if (audioCtx && !audioBroken) {
    try { audioCtx.pause(); } catch (e) { /* 忽略暂停时序竞争 */ }
  }
}

function audioSeek(sec) {
  if (audioCtx && !audioBroken) {
    try { audioCtx.seek(sec); } catch (e) { /* 忽略 */ }
  }
}

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

function snapshot() {
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
    // 真实音频曲目：进度跟随音频时钟，自然播完由 onEnded 切歌；
    // 模拟曲目维持原有 +1s 走秒
    if (currentIsAudio() && audioCtx && !audioBroken) {
      syncPositionFromAudio();
      emit();
      return;
    }
    state.position += 1;
    if (state.position >= current().duration) {
      next();
      return;
    }
    emit();
  }, 1000);
}

function toggle() {
  const willPlay = !state.playing;
  // 真实音频曲目：播放态同步给 InnerAudioContext
  if (currentIsAudio()) {
    const a = ensureAudioCtx();
    if (a && !audioBroken) {
      if (willPlay) {
        audioSeek(state.position);
        a.play();
      } else {
        pauseAudio();
      }
    }
  } else {
    pauseAudio();
  }
  state.playing = willPlay;
  ensureTimer();
  emit();
}

function play() {
  if (!state.playing) toggle();
}

function switchTo(index, autoplay) {
  const prevHadAudio = currentIsAudio();
  state.index = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  state.position = 0;
  state.playing = !!autoplay;
  // 真实音频曲目：切到即重置音频到 0；切走则暂停
  if (currentIsAudio()) {
    const a = ensureAudioCtx();
    if (a && !audioBroken) {
      audioSeek(0);
      if (state.playing) a.play(); else pauseAudio();
    }
  } else if (prevHadAudio) {
    pauseAudio();
    audioSeek(0);
  }
  ensureTimer();
  emit();
}

function next() {
  switchTo(state.index + 1, state.playing);
}

function prev() {
  switchTo(state.index - 1, state.playing);
}

function seek(percent) {
  state.position = Math.round((percent / 100) * current().duration);
  // 真实音频曲目：进度跳变同步 seek 音频
  if (currentIsAudio()) audioSeek(state.position);
  emit();
}

// 按曲目 id 播放（唱片夹点击真实音频唱片用），返回是否命中
function playTrack(id, autoplay) {
  const idx = PLAYLIST.findIndex((t) => t.id === id);
  if (idx < 0) return false;
  switchTo(idx, autoplay !== false);
  return true;
}

function subscribe(fn) {
  listeners.add(fn);
  fn(snapshot(), 'local');
  return () => listeners.delete(fn);
}

// 对端播放状态（room-sync 'player' 消息）：last-write-wins
// 进度误差 ≤2.5s 不校正；playing 时按 sentAt 补偿网络延迟
function applyRemote(msg) {
  if (!msg || typeof msg !== 'object') return;
  const compensated = typeof msg.position === 'number'
    ? msg.position + (msg.playing && msg.sentAt ? Math.max(0, (Date.now() - msg.sentAt) / 1000) : 0)
    : state.position;
  if (typeof msg.index === 'number' && msg.index !== state.index) {
    const prevHadAudio = currentIsAudio();
    state.index = ((msg.index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    state.position = compensated;
    // 对端切歌同样要驱动真实音频层：切走暂停，切入 seek 到对端进度
    if (currentIsAudio()) {
      const a = ensureAudioCtx();
      if (a && !audioBroken) audioSeek(compensated);
    } else if (prevHadAudio) {
      pauseAudio();
      audioSeek(0);
    }
  } else if (Math.abs(compensated - state.position) > 2.5) {
    state.position = Math.min(compensated, current().duration);
    if (currentIsAudio()) audioSeek(state.position);
  }
  if (typeof msg.playing === 'boolean') {
    state.playing = msg.playing;
    // 对端播放态同步给音频层
    if (currentIsAudio()) {
      const a = ensureAudioCtx();
      if (a && !audioBroken) {
        if (state.playing) {
          audioSeek(state.position);
          a.play();
        } else {
          pauseAudio();
        }
      }
    }
  }
  ensureTimer();
  emit('remote');
}

module.exports = {
  subscribe,
  toggle,
  play,
  next,
  prev,
  seek,
  switchTo,
  playTrack,
  applyRemote,
  snapshot,
  PLAYLIST
};
