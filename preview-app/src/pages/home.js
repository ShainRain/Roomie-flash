/**
 * home — FUNCTIONAL port of miniprogram/pages/home
 * RoomScene hero (~52% viewport) with saved room state + records + MOMO character,
 * LIVE pill, greeting, online-friends strip, task card, embedded mini-player,
 * CTA 进入放映室 → #/room.
 */
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import { createMiniPlayer } from '../components/player/index.js';
import RoomScene from '../components/room-scene/index.js';
import Player from '../state/player.js';
import RoomStore from '../state/room.js';
import RecordsUtil from '../state/records.js';
import { HOME_FRIENDS } from '../state/friends.js';
import { getStorageSync } from '../adapters/storage.js';
import { navigate } from '../router/router.js';

const USER = { name: 'MOMO', level: 7, badge: '建筑师', roomId: '0731', roomName: '深夜放映室' };

export function mount(container) {
  const page = document.createElement('div');
  page.className = 'p-home page';
  // 滚动容器独立于 page：tabbar 绝对定位于 page 底部，不随内容滚动
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  const header = createHeader(scroller, {
    subtitle: `${USER.roomName} · ${USER.roomId}`,
    avatar: USER.name[0],
    share: true,
    onShare: () => {
      const text = `${USER.name} 的深夜放映室正在放映，来一起听`;
      if (navigator.share) {
        navigator.share({ title: 'Roomie', text, url: location.href }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${text} ${location.href}`).catch(() => {});
      }
    }
  });

  const pad = document.createElement('div');
  pad.className = 'page-pad';

  // 今晚状态
  const tonight = document.createElement('div');
  tonight.className = 'tonight anim-in';
  const hi = document.createElement('span');
  hi.className = 'tonight-hi';
  hi.textContent = '今晚，';
  const title = document.createElement('span');
  title.className = 'tonight-title';
  const nameEl = document.createElement('span');
  nameEl.className = 'tonight-name';
  nameEl.textContent = USER.name;
  title.append(nameEl, ' 想放一首歌');
  tonight.append(hi, title);
  pad.appendChild(tonight);

  // Room Master Hero
  const room = RoomStore.getRoom();
  const snap = Player.snapshot();
  const heroWrap = document.createElement('div');
  heroWrap.className = 'hero-wrap anim-in anim-d1';
  const heroStage = document.createElement('div');
  heroStage.className = 'hero-stage';
  heroWrap.appendChild(heroStage);

  const scene = new RoomScene(heroStage, {
    floor: room.floor,
    lightTemp: room.lightTemp,
    lightBright: room.lightBright,
    furniture: room.furniture,
    records: RecordsUtil.readSelection(getStorageSync),
    lampOn: true,
    projectorOn: true,
    mode: 'preview',
    characters: [
      { id: 'momo', x: 54.6, y: 67, frame: 'idle', facing: 1 },
      { id: 'kiki', x: 25.6, y: 59.2, frame: 'idle', facing: 1 }
    ],
    nowPlaying: { playing: snap.playing, title: snap.track.title },
    onStageTap: () => navigate('/room')
  });

  const pillTl = document.createElement('div');
  pillTl.className = 'hero-pill hero-pill-tl pill pill-dark';
  pillTl.innerHTML = '<span class="live-dot"></span>';
  pillTl.append('放映中 · 2 位 roomie');
  pillTl.addEventListener('click', () => navigate('/room'));
  const pillTr = document.createElement('div');
  pillTr.className = 'hero-pill hero-pill-tr pill pill-live';
  pillTr.textContent = '+12 氛围值';
  const chip = document.createElement('div');
  chip.className = 'hero-chip';
  chip.innerHTML = '<div class="chip-avatar">M</div>';
  const chipText = document.createElement('span');
  chipText.className = 'chip-text';
  chipText.textContent = `${USER.name} 走近唱机`;
  chip.appendChild(chipText);
  chip.addEventListener('click', () => navigate('/room'));
  heroWrap.append(pillTl, pillTr, chip);
  pad.appendChild(heroWrap);

  // 在线好友条带
  const strip = document.createElement('div');
  strip.className = 'friends-strip anim-in anim-d2';
  HOME_FRIENDS.forEach((f) => {
    const chipEl = document.createElement('div');
    chipEl.className = 'friend-chip';
    const dot = document.createElement('div');
    dot.className = 'friend-dot';
    dot.style.background = f.color;
    dot.textContent = f.name[0];
    const meta = document.createElement('div');
    meta.className = 'friend-meta';
    const nm = document.createElement('span');
    nm.className = 'friend-name';
    nm.textContent = f.name;
    const st = document.createElement('span');
    st.className = 'friend-status';
    st.textContent = f.nowPlaying ? `${f.status}《${Player.snapshot().track.title}》` : f.status;
    meta.append(nm, st);
    chipEl.append(dot, meta);
    chipEl.addEventListener('click', () => navigate('/friends'));
    strip.appendChild(chipEl);
  });
  pad.insertBefore(strip, heroWrap); // 条带置于 hero 之前，避免 task-card 的 -72rpx 叠层遮住它

  // 放映任务
  const task = document.createElement('div');
  task.className = 'card task-card anim-in anim-d3';
  task.innerHTML = `
    <div class="task-plus">+</div>
    <div class="task-text">
      <span class="task-sub">今晚的放映任务</span>
      <span class="task-title">让 KIKI 找到唱片墙</span>
    </div>
    <div class="pill pill-amber">+80 XP</div>`;
  task.addEventListener('click', () => navigate('/room'));
  pad.appendChild(task);

  // 内嵌播放器
  const playerWrap = document.createElement('div');
  playerWrap.className = 'player-wrap anim-in anim-d4';
  const miniPlayer = createMiniPlayer(playerWrap);
  pad.appendChild(playerWrap);

  // CTA
  const cta = document.createElement('button');
  cta.className = 'btn-primary cta anim-in anim-d4';
  cta.innerHTML = '<span class="cta-label">进入放映室</span><span class="cta-arrow">→</span>';
  cta.addEventListener('click', () => navigate('/room'));
  pad.appendChild(cta);

  scroller.appendChild(pad);
  const tabbar = createTabbar(page);
  container.appendChild(page);

  const unsubPlayer = Player.subscribe((s) => {
    scene.setProps({ nowPlaying: { playing: s.playing, title: s.track.title } });
  });
  const unsubRoom = RoomStore.subscribe((r) => {
    scene.setProps({ floor: r.floor, lightTemp: r.lightTemp, lightBright: r.lightBright, furniture: r.furniture });
  });

  return { page, header, scene, miniPlayer, tabbar, unsubPlayer, unsubRoom };
}

let ctx = null;

export default {
  mount(container) {
    ctx = mount(container);
  },
  unmount() {
    if (!ctx) return;
    ctx.unsubPlayer();
    ctx.unsubRoom();
    ctx.scene.destroy();
    ctx.miniPlayer.destroy();
    ctx.tabbar.destroy();
    ctx.header.destroy();
    ctx.page.remove();
    ctx = null;
  }
};
