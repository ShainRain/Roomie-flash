/**
 * song — FUNCTIONAL port of miniprogram/pages/song
 * 唱片播放界面：Hi-Fi 背景 + 封套 + 抽出的黑胶（6s/圈，仅播放时旋转）。
 * 一切播放状态唯一来源 = state/player.js 单例快照；本页只 subscribe/dispatch，
 * 无任何自有播放状态或计时器。无 tabbar（对齐小程序：song 非 tab 页）。
 */
import './song.css';
import Player from '../state/player.js';
import { showToast } from '../adapters/platform.js';
import { back } from '../router/router.js';
import { assetUrl } from '../utils/asset-url.js';

const COMMENTS = [
  { user: 'KIKI', text: '前奏一响就回到高中教室了', likes: 1204 },
  { user: 'ABO', text: '在 Roomie 放映室里听这首，氛围感拉满', likes: 986 },
  { user: 'RITA', text: '深夜循环第 27 遍', likes: 453 }
];

export function mount(container) {
  let snap = Player.snapshot();
  let tab = 'lyric';
  let dragging = false;
  let dragValue = 0;
  let lastLyricIndex = -1;
  let lyricScrollReady = false;

  const page = document.createElement('div');
  page.className = 'p-song page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  // ---- 顶部栏 ----
  const topbar = document.createElement('div');
  topbar.className = 'topbar rise-in';
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-ic';
  backBtn.textContent = '‹';
  backBtn.addEventListener('click', () => back());
  const tt = document.createElement('div');
  tt.className = 'topbar-title';
  const ttBrand = document.createElement('span');
  ttBrand.className = 'tt-brand en-serif';
  ttBrand.textContent = 'Roomie';
  const ttSub = document.createElement('span');
  ttSub.className = 'tt-sub';
  ttSub.textContent = '从放映室取出一张唱片';
  tt.append(ttBrand, ttSub);
  const shareBtn = document.createElement('button');
  shareBtn.className = 'nav-ic';
  shareBtn.textContent = '↗';
  shareBtn.addEventListener('click', () => showToast({ title: '明信片分享见「创建」页', icon: 'none' }));
  topbar.append(backBtn, tt, shareBtn);
  scroller.appendChild(topbar);

  // ---- Hero ----
  const hero = document.createElement('div');
  hero.className = 'song-hero rise-in rise-d1';
  const heroBg = document.createElement('img');
  heroBg.className = 'hero-bg';
  heroBg.src = assetUrl('/assets/img/song-hifi-bg.webp');
  heroBg.alt = '';
  const heroFade = document.createElement('div');
  heroFade.className = 'hero-fade';
  const sleeve = document.createElement('img');
  sleeve.className = 'hero-sleeve';
  sleeve.alt = '';
  const disc = document.createElement('img');
  disc.className = 'hero-disc';
  disc.src = assetUrl('/assets/img/song-disc.webp');
  disc.alt = '';
  hero.append(heroBg, heroFade, sleeve, disc);
  scroller.appendChild(hero);

  // ---- 纸张卡片 ----
  const card = document.createElement('div');
  card.className = 'card song-card rise-in rise-d2';

  const head = document.createElement('div');
  head.className = 'song-head';
  const names = document.createElement('div');
  names.className = 'song-names';
  const kicker = document.createElement('span');
  kicker.className = 'song-kicker en-serif';
  kicker.textContent = 'Now Spinning';
  const titleEl = document.createElement('span');
  titleEl.className = 'song-title';
  const artistEl = document.createElement('span');
  artistEl.className = 'song-artist';
  names.append(kicker, titleEl, artistEl);
  const like = document.createElement('span');
  like.className = 'pill pill-green-soft';
  like.textContent = '收藏中';
  like.addEventListener('click', () => showToast({ title: '已赞', icon: 'none' }));
  head.append(names, like);
  card.appendChild(head);

  // 进度条（拖动预览 / 松手提交，复刻 slider changing/change 语义）
  const seekRow = document.createElement('div');
  seekRow.className = 'seek-row';
  const posEl = document.createElement('span');
  posEl.className = 'time';
  const seek = document.createElement('input');
  seek.className = 'seek';
  seek.type = 'range';
  seek.min = '0';
  seek.max = '100';
  seek.step = '0.1';
  seek.setAttribute('aria-label', '播放进度');
  const durEl = document.createElement('span');
  durEl.className = 'time';
  seekRow.append(posEl, seek, durEl);
  card.appendChild(seekRow);

  seek.addEventListener('input', () => {
    dragging = true;
    dragValue = Number(seek.value);
    paintSeek(dragValue);
  });
  seek.addEventListener('change', () => {
    Player.seek(Number(seek.value));
    dragging = false;
  });

  function paintSeek(pct) {
    const v = Math.max(0, Math.min(100, pct));
    seek.style.background = `linear-gradient(90deg, var(--green) ${v}%, var(--line) ${v}%)`;
  }

  // 传输控制
  const controls = document.createElement('div');
  controls.className = 'controls';
  const shuffle = document.createElement('button');
  shuffle.className = 'ctl-side';
  shuffle.setAttribute('aria-label', '随机播放');
  shuffle.innerHTML = '<div class="ic-shuffle"><div class="ic-shuffle-a"></div><div class="ic-shuffle-b"></div></div>';
  shuffle.addEventListener('click', () => showToast({ title: '随机播放 · 演示功能', icon: 'none' }));
  const prevBtn = document.createElement('button');
  prevBtn.className = 'ctl-skip';
  prevBtn.setAttribute('aria-label', '上一首');
  prevBtn.innerHTML = '<div class="ic-prev"></div>';
  prevBtn.addEventListener('click', () => Player.prev());
  const playBtn = document.createElement('button');
  playBtn.className = 'ctl-play';
  playBtn.setAttribute('aria-label', '播放/暂停');
  const playIcon = document.createElement('div');
  playBtn.appendChild(playIcon);
  playBtn.addEventListener('click', () => Player.toggle());
  const nextBtn = document.createElement('button');
  nextBtn.className = 'ctl-skip';
  nextBtn.setAttribute('aria-label', '下一首');
  nextBtn.innerHTML = '<div class="ic-next"></div>';
  nextBtn.addEventListener('click', () => Player.next());
  const loop = document.createElement('button');
  loop.className = 'ctl-side';
  loop.setAttribute('aria-label', '循环播放');
  loop.innerHTML = '<div class="ic-loop"></div>';
  loop.addEventListener('click', () => showToast({ title: '循环播放 · 演示功能', icon: 'none' }));
  controls.append(shuffle, prevBtn, playBtn, nextBtn, loop);
  card.appendChild(controls);

  // 歌词 / 评论 分段
  const tabs = document.createElement('div');
  tabs.className = 'song-tabs';
  const tabLyric = document.createElement('button');
  tabLyric.className = 'song-tab';
  tabLyric.textContent = '歌词';
  const tabComment = document.createElement('button');
  tabComment.className = 'song-tab';
  tabComment.textContent = '评论';
  tabLyric.addEventListener('click', () => switchTab('lyric'));
  tabComment.addEventListener('click', () => switchTab('comment'));
  tabs.append(tabLyric, tabComment);
  card.appendChild(tabs);

  const lyrics = document.createElement('div');
  lyrics.className = 'lyrics';
  const comments = document.createElement('div');
  comments.className = 'comments';
  COMMENTS.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'comment';
    const ch = document.createElement('div');
    ch.className = 'comment-head';
    const u = document.createElement('span');
    u.className = 'comment-user';
    u.textContent = c.user;
    const l = document.createElement('span');
    l.className = 'comment-likes';
    l.textContent = `${c.likes} 赞`;
    ch.append(u, l);
    const t = document.createElement('span');
    t.className = 'comment-text';
    t.textContent = c.text;
    el.append(ch, t);
    comments.appendChild(el);
  });
  card.append(lyrics, comments);
  scroller.appendChild(card);
  container.appendChild(page);

  function switchTab(next) {
    tab = next;
    tabLyric.classList.toggle('song-tab-on', tab === 'lyric');
    tabComment.classList.toggle('song-tab-on', tab === 'comment');
    lyrics.hidden = tab !== 'lyric';
    comments.hidden = tab !== 'comment';
  }

  function renderLyrics() {
    lyrics.innerHTML = '';
    snap.track.lyrics.forEach((line, i) => {
      const el = document.createElement('div');
      el.className = `lyric-line${i === snap.lyricIndex ? ' lyric-on' : ''}`;
      el.dataset.index = i;
      el.textContent = line.text;
      lyrics.appendChild(el);
    });
    const tail = document.createElement('div');
    tail.className = 'lyrics-tail';
    lyrics.appendChild(tail);
  }

  // Player 快照 → 全部 UI（唯一数据流）
  function apply(nextSnap) {
    snap = nextSnap;
    disc.classList.toggle('hero-disc-spin', snap.playing);
    sleeve.src = snap.track.sleeve || `/assets/img/song-sleeve-${snap.track.id}.webp`;
    titleEl.textContent = snap.track.title;
    artistEl.textContent = `${snap.track.artist} · MOMO 的收藏`;
    posEl.textContent = dragging ? fmtDrag() : snap.positionText;
    durEl.textContent = snap.durationText;
    playIcon.className = snap.playing ? 'ic-pause-lg' : 'ic-play-lg';
    if (!dragging) {
      seek.value = String(snap.progress);
      paintSeek(snap.progress);
    }
    // 歌词行变化才重排/滚动（避免每秒重写）
    if (snap.lyricIndex !== lastLyricIndex) {
      const trackChanged = lyrics.dataset.track !== snap.track.id;
      lastLyricIndex = snap.lyricIndex;
      if (trackChanged) {
        lyrics.dataset.track = snap.track.id;
        renderLyrics();
      } else {
        lyrics.querySelectorAll('.lyric-line').forEach((el) => {
          el.classList.toggle('lyric-on', Number(el.dataset.index) === snap.lyricIndex);
        });
      }
      // 只滚歌词容器（scrollIntoView 会连外层页面一起滚，等价于小程序 scroll-view scroll-into-view）
      // offsetTop 相对 .lyrics（position:relative），行高实测，目标行定位到第 3 条可见行
      const active = lyrics.querySelector('.lyric-on');
      if (active && tab === 'lyric') {
        const first = !lyricScrollReady;
        lyricScrollReady = true;
        const doScroll = (behavior) => {
          const lines = lyrics.querySelectorAll('.lyric-line');
          const lineH = lines.length > 1 ? lines[1].offsetTop - lines[0].offsetTop : active.offsetHeight;
          lyrics.scrollTo({ top: Math.max(0, active.offsetTop - 2 * lineH), behavior });
        };
        // 首次定位延后到布局稳定后瞬时跳转（mount 帧的布局数据不可靠）
        if (first) setTimeout(() => doScroll('auto'), 350);
        else doScroll('smooth');
      }
    }
  }

  function fmtDrag() {
    const sec = Math.round((dragValue / 100) * snap.duration);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }

  switchTab('lyric');
  const unsub = Player.subscribe(apply);

  return {
    unmount() {
      unsub();
      page.remove();
    }
  };
}

let ctx = null;

export default {
  mount(containerEl) {
    ctx = mount(containerEl);
  },
  unmount() {
    if (ctx) {
      ctx.unmount();
      ctx = null;
    }
  }
};
