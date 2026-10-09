/**
 * create — 创建页（FUNCTIONAL port of miniprogram/pages/create）。
 * tabbar ＋ 入口：建筑师模式 / 发起放映 / 生成明信片 三张入口卡，
 * 与小程序同序同文案；入场动效 anim-in + anim-dN 与小程序一致。
 * 三个目标页（architect/room/postcard）均为 push 语义页，与小程序 navigateTo 对应。
 */
import './create.css';
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import { navigate } from '../router/router.js';

const ENTRIES = [
  { key: 'architect', glyph: '筑', title: '建筑师模式', desc: '布置家具 · 地板材质 · 灯光色温', path: '/architect' },
  { key: 'show', glyph: '映', title: '发起放映', desc: '进入深夜放映室，开始今晚的放映', path: '/room' },
  { key: 'postcard', glyph: '笺', title: '生成明信片', desc: '把房间做成海报，分享给好友', path: '/postcard' }
];

export function mount(container) {
  const page = document.createElement('div');
  page.className = 'p-create page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  const header = createHeader(scroller, {
    subtitle: '深夜放映室 · 0731',
    avatar: 'M',
    live: false,
    pageTitle: '创建',
    pageSubtitle: 'Create'
  });

  const pad = document.createElement('div');
  pad.className = 'page-pad';
  scroller.appendChild(pad);

  ENTRIES.forEach((item, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `paper-card entry anim-in anim-d${index + 1}`;
    card.dataset.key = item.key;
    card.innerHTML = `
      <span class="entry-glyph" aria-hidden="true"></span>
      <span class="entry-info">
        <span class="entry-title"></span>
        <span class="entry-desc"></span>
      </span>
      <span class="entry-arrow" aria-hidden="true">›</span>`;
    card.querySelector('.entry-glyph').textContent = item.glyph;
    card.querySelector('.entry-title').textContent = item.title;
    card.querySelector('.entry-desc').textContent = item.desc;
    card.addEventListener('click', () => navigate(item.path));
    pad.appendChild(card);
  });

  const tabbar = createTabbar(page);
  container.appendChild(page);

  return {
    unmount() {
      tabbar.destroy();
      header.destroy();
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
