/**
 * messages — 独立消息页（参考 miniprogram/pages/messages 信息结构：
 * sender/avatar 色、summary、time、unread 点、action 按钮、空态、邀请进 Duo）。
 * Web 差异：已读状态经 storage adapter 持久化（roomie_messages_read），
 * roomie_unread 角标实时同步；mock 数据，无后端。
 */
import './messages.css';
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import { getStorageSync, setStorageSync } from '../adapters/storage.js';
import { navigate } from '../router/router.js';

// mock 消息流（信息结构对齐小程序；曲目名为 Web 器乐曲库，无版权内容）
const MESSAGES = [
  { id: 1, type: 'invite', from: 'KIKI', color: '#F5B83D', title: '邀请你一起听《Peaceful》', time: '刚刚', unread: true, action: '接受' },
  { id: 2, type: 'system', from: 'NANA', color: '#7FB5E8', title: '接受了你的邀请，已进入你的放映室', time: '12 分钟前', unread: true, action: '进入房间' },
  { id: 3, type: 'system', from: 'ABO', color: '#E8734A', title: '在你的唱片墙前停留了 5 分钟', time: '1 小时前', unread: false },
  { id: 4, type: 'system', from: 'RITA', color: '#C9CDD4', title: '收藏了你分享的《夜航》', time: '昨天', unread: false }
];

const READ_KEY = 'roomie_messages_read';

function loadReadIds() {
  const raw = getStorageSync(READ_KEY);
  return Array.isArray(raw) ? new Set(raw.filter((id) => typeof id === 'number')) : new Set();
}

export function mount(container) {
  const readIds = loadReadIds();
  const messages = MESSAGES.map((m) => ({ ...m, unread: m.unread && !readIds.has(m.id) }));

  const page = document.createElement('div');
  page.className = 'p-messages page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  const header = createHeader(scroller, {
    subtitle: '深夜放映室 · 0731',
    avatar: 'M',
    live: false,
    pageTitle: '消息',
    pageSubtitle: 'Messages'
  });

  const pad = document.createElement('div');
  pad.className = 'page-pad';
  scroller.appendChild(pad);

  const tabbar = createTabbar(page);
  container.appendChild(page);

  // roomie_unread = 当前未读数（tabbar 角标唯一来源）；已读集合持久化
  function syncUnread() {
    const count = messages.filter((m) => m.unread).length;
    setStorageSync('roomie_unread', count);
    setStorageSync(READ_KEY, messages.filter((m) => !m.unread).map((m) => m.id));
    tabbar.refresh();
  }

  function markRead(id) {
    const msg = messages.find((m) => m.id === id);
    if (!msg || !msg.unread) return;
    msg.unread = false;
    const row = listEl.querySelector(`[data-id="${id}"]`);
    if (row) {
      row.querySelector('.m-unread')?.remove();
      row.querySelector('.m-name').classList.remove('m-name-unread');
      row.querySelector('.m-summary').classList.remove('m-summary-unread');
    }
    syncUnread();
  }

  let listEl = null;
  if (messages.length) {
    listEl = document.createElement('div');
    listEl.className = 'card msg-list anim-in';
    messages.forEach((m) => {
      const row = document.createElement('div');
      row.className = 'msg';
      row.dataset.id = String(m.id);

      const avatar = document.createElement('div');
      avatar.className = 'm-avatar';
      avatar.style.background = m.color;
      avatar.textContent = m.from[0];
      if (m.unread) {
        const dot = document.createElement('span');
        dot.className = 'm-unread';
        avatar.appendChild(dot);
      }

      const info = document.createElement('div');
      info.className = 'm-info';
      const r = document.createElement('div');
      r.className = 'm-row';
      const name = document.createElement('span');
      name.className = `m-name${m.unread ? ' m-name-unread' : ''}`;
      name.textContent = m.from;
      const time = document.createElement('span');
      time.className = 'm-time';
      time.textContent = m.time;
      r.append(name, time);
      const summary = document.createElement('span');
      summary.className = `m-summary${m.unread ? ' m-summary-unread' : ''}`;
      summary.textContent = m.title;
      info.append(r, summary);

      row.append(avatar, info);
      row.addEventListener('click', () => markRead(m.id));

      if (m.action) {
        const btn = document.createElement('button');
        btn.className = 'm-btn';
        btn.textContent = m.action;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          markRead(m.id);
          navigate(`/duo?peer=${m.from}`);
        });
        row.appendChild(btn);
      }
      listEl.appendChild(row);
    });
    pad.appendChild(listEl);
  } else {
    const empty = document.createElement('div');
    empty.className = 'card msg-empty anim-in';
    empty.innerHTML = `
      <div class="empty-mark"><div class="empty-dot"></div></div>
      <span class="empty-title">暂时没有新消息</span>
      <span class="empty-sub">好友的邀请和房间动态会出现在这里</span>`;
    pad.appendChild(empty);
  }

  // 进入页面即同步一次角标（读取持久化的已读集合，不会把已读重新标未读）
  syncUnread();

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
