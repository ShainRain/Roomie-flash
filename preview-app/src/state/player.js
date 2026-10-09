/**
 * Roomie 全局播放器状态机 — Web 手动移植版（MANUAL PORT，非 sync-shared 生成）
 *
 * 背景：miniprogram/utils/player.js 自 e040ac2 起含 wx.createInnerAudioContext
 * 真实音频层与版权曲目歌词，无法机械转换进 Web 运行时。本文件保持公共 API
 * 完全一致（subscribe/toggle/play/next/prev/seek/switchTo/playTrack/applyRemote/
 * snapshot + PLAYLIST 导出），设备层换成 src/adapters/audio.js 的
 * HTMLAudioElement 驱动；歌单来自 src/data/audio-manifest.js（合法器乐迁移：
 * 仅 1 首真实音频，其余 mock）。
 *
 * 语义镜像（与小程序 player.js 一致）：
 * - 真实音频曲目：懒创建驱动、进度以音频时钟为准（timeupdate）、播完 onEnded 切歌、
 *   加载失败回退 mock 走秒（Demo 不断链）
 * - mock 曲目：1s 定时器走秒（无声，占位演示）
 * - applyRemote：last-write-wins + 2.5s 容差 + sentAt 延迟补偿 + source 标记防回声
 * - 歌单顺序是契约：新曲目只能往尾部追加（房间同步 index 语义）
 */
import AUDIO_TRACKS from '../data/audio-manifest.js';
import { createDriver } from '../adapters/audio.js';

const PLAYLIST = AUDIO_TRACKS;

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

// ---- 真实音频层（仅 audioAvailable 曲目启用；Node 测试环境无 Audio，自动降级纯模拟）----
let driver = null;
let driverTrackId = '';

function hasWebAudio() {
  return typeof Audio !== 'undefined';
}

function currentIsAudio() {
  const c = current();
  return !!(c.audioAvailable && c.src);
}

function ensureDriver() {
  if (!hasWebAudio()) return null;
  const c = current();
  if (driver && driverTrackId === c.id && !driver.broken) return driver;
  if (driver) {
    driver.dispose();
    driver = null;
  }
  driverTrackId = c.id;
  driver = createDriver({
    onEnded: () => next(),
    onError: (err) => {
      console.warn('[player] 真实音频加载失败，回退模拟走秒:', c.src, err && (err.message || err.code || ''));
    },
    onTimeUpdate: (sec) => {
      if (currentIsAudio() && driver && !driver.broken) state.position = sec;
    }
  });
  driver.load(c.src);
  return driver;
}

function pauseAudio() {
  if (driver && !driver.broken) {
    try { driver.pause(); } catch (e) { /* 忽略暂停时序竞争 */ }
  }
}

function audioSeek(sec) {
  if (driver && !driver.broken) {
    try { driver.seek(sec); } catch (e) { /* 忽略 */ }
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
    // 真实音频曲目：进度跟随音频时钟（onTimeUpdate 写回），自然播完由 onEnded 切歌；
    // mock 曲目维持原有 +1s 走秒
    if (currentIsAudio() && driver && !driver.broken) {
      if (typeof driver.currentTime === 'number') state.position = driver.currentTime;
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

export function toggle() {
  const willPlay = !state.playing;
  // 真实音频曲目：播放态同步给 audio 驱动
  if (currentIsAudio()) {
    const a = ensureDriver();
    if (a && !a.broken) {
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

export function play() {
  if (!state.playing) toggle();
}

export function switchTo(index, autoplay) {
  const prevHadAudio = currentIsAudio();
  state.index = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  state.position = 0;
  state.playing = !!autoplay;
  // 真实音频曲目：切到即重置音频到 0；切走则暂停
  if (currentIsAudio()) {
    const a = ensureDriver();
    if (a && !a.broken) {
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

export function next() {
  switchTo(state.index + 1, state.playing);
}

export function prev() {
  switchTo(state.index - 1, state.playing);
}

export function seek(percent) {
  state.position = Math.round((percent / 100) * current().duration);
  // 真实音频曲目：进度跳变同步 seek 音频
  if (currentIsAudio()) audioSeek(state.position);
  emit();
}

// 按曲目 id 播放（唱片夹点击真实音频唱片用），返回是否命中
export function playTrack(id, autoplay) {
  const idx = PLAYLIST.findIndex((t) => t.id === id);
  if (idx < 0) return false;
  switchTo(idx, autoplay !== false);
  return true;
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
    const prevHadAudio = currentIsAudio();
    state.index = ((msg.index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    state.position = compensated;
    // 对端切歌同样要驱动真实音频层：切走暂停，切入 seek 到对端进度
    if (currentIsAudio()) {
      const a = ensureDriver();
      if (a && !a.broken) audioSeek(compensated);
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
      const a = ensureDriver();
      if (a && !a.broken) {
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

export default { subscribe, toggle, play, next, prev, seek, switchTo, playTrack, applyRemote, snapshot, PLAYLIST };
export { PLAYLIST };
