/**
 * mini-player — transport bar bound to state/player.js
 * Port of miniprogram/components/mini-player (WXML/WXSS → DOM).
 * tapTarget 'song' → tap on cover/info navigates to #/song.
 */
import Player from '../../state/player.js';
import { navigate } from '../../router/router.js';

export function createMiniPlayer(container, { subtitle = '', tapTarget = 'song' } = {}) {
  const el = document.createElement('div');
  el.className = 'mp-card';
  el.innerHTML = `
    <div class="mp-vinyl"><div class="mp-vinyl-hole"></div></div>
    <div class="mp-info">
      <div class="mp-title"></div>
      <div class="mp-subtitle"></div>
      <div class="mp-progress-row">
        <span class="mp-time mp-pos"></span>
        <div class="mp-track"><div class="mp-fill"></div></div>
        <span class="mp-time mp-dur"></span>
      </div>
    </div>
    <div class="mp-ctrl">
      <div class="mp-ctrl-sm mp-prev"><div class="ic-prev"></div></div>
      <div class="mp-ctrl-play"><div class="ic-play"></div></div>
      <div class="mp-ctrl-sm mp-next"><div class="ic-next"></div></div>
    </div>`;

  const vinyl = el.querySelector('.mp-vinyl');
  const title = el.querySelector('.mp-title');
  const sub = el.querySelector('.mp-subtitle');
  const pos = el.querySelector('.mp-pos');
  const dur = el.querySelector('.mp-dur');
  const fill = el.querySelector('.mp-fill');
  const playIcon = el.querySelector('.mp-ctrl-play > div');

  function apply(snap) {
    vinyl.classList.toggle('mp-vinyl-spin', snap.playing);
    title.textContent = snap.track.title;
    sub.textContent = subtitle || `${snap.track.artist} · ${snap.track.album}`;
    pos.textContent = snap.positionText;
    dur.textContent = snap.durationText;
    fill.style.width = `${snap.progress}%`;
    playIcon.className = snap.playing ? 'ic-pause' : 'ic-play';
  }

  const unsub = Player.subscribe(apply);

  const openDetail = () => { if (tapTarget === 'song') navigate('/song'); };
  vinyl.addEventListener('click', openDetail);
  el.querySelector('.mp-info').addEventListener('click', openDetail);
  el.querySelector('.mp-ctrl-play').addEventListener('click', () => Player.toggle());
  el.querySelector('.mp-prev').addEventListener('click', () => Player.prev());
  el.querySelector('.mp-next').addEventListener('click', () => Player.next());

  container.appendChild(el);

  return {
    el,
    destroy() {
      unsub();
      el.remove();
    }
  };
}

export default createMiniPlayer;
