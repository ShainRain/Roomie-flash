/**
 * Audio adapter — Web 真实音频驱动（HTMLAudioElement）。
 *
 * 这是 Player 状态机的设备层接缝（对应小程序 wx.createInnerAudioContext 的
 * 三级寻址层）。Web 没有「包外不可读」限制：`preview-app/public/audio/` 下的
 * 文件直接经 /audio/*.mp3 引用，单一候选，无需回退链。
 *
 * 契约（由 src/state/player.js 调用）：
 *   createDriver({ onEnded, onError, onTimeUpdate }) → driver
 *   driver.load(src)   — 切换音源（自动暂停当前）
 *   driver.play() / driver.pause() / driver.seek(seconds)
 *   driver.broken      — 加载失败后为 true（Player 据此回退 mock 走秒）
 *   driver.dispose()
 *
 * 真实音频挂载规则：不接任何版权音源；仓库内无授权证明的文件一律
 * licenseStatus: unverified（见 src/data/audio-manifest.js）。
 */

export function createDriver({ onEnded, onError, onTimeUpdate } = {}) {
  const el = new Audio();
  el.preload = 'auto';
  const driver = {
    broken: false,
    currentTime: 0,
    load(src) {
      driver.broken = false;
      driver.currentTime = 0;
      el.src = src;
      el.load();
    },
    play() {
      const p = el.play();
      if (p && p.catch) p.catch((err) => { driver.broken = true; if (onError) onError(err); });
    },
    pause() { el.pause(); },
    seek(sec) {
      try { el.currentTime = Math.max(0, sec); } catch (e) { /* 忽略未就绪时的 seek */ }
    },
    dispose() {
      try { el.pause(); } catch (e) { /* ignore */ }
      el.removeAttribute('src');
      el.load();
    }
  };
  el.addEventListener('ended', () => { if (onEnded) onEnded(); });
  el.addEventListener('error', () => {
    driver.broken = true;
    if (onError) onError(el.error || new Error('audio load failed'));
  });
  el.addEventListener('timeupdate', () => {
    driver.currentTime = el.currentTime;
    if (onTimeUpdate) onTimeUpdate(el.currentTime);
  });
  return driver;
}

export default { createDriver };
