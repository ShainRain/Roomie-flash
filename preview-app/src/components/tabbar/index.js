/**
 * tabbar — 5-tab bar (房间/好友/＋/消息/我) with real router links.
 * Unread badge from storage (roomie_unread), refreshed on route change.
 * Port of miniprogram/custom-tab-bar semantics.
 */
import { navigate, currentPath, onChange } from '../../router/router.js';
import { getStorageSync } from '../../adapters/storage.js';

const TABS = [
  { path: '/', text: '房间', glyph: '⌂' },
  { path: '/friends', text: '好友', glyph: '♡' },
  { path: '/architect', text: '', glyph: '＋', create: true },
  { path: '/messages', text: '消息', glyph: '✉', badge: true },
  { path: '/profile', text: '我', glyph: '☺' }
];

export function createTabbar(container) {
  const el = document.createElement('nav');
  el.className = 'tabbar';

  TABS.forEach((tab) => {
    if (tab.create) {
      const btn = document.createElement('button');
      btn.className = 'tab-create';
      btn.textContent = tab.glyph;
      btn.setAttribute('aria-label', '创建');
      btn.addEventListener('click', () => navigate(tab.path));
      el.appendChild(btn);
      return;
    }
    const item = document.createElement('a');
    item.className = 'tab-item';
    item.dataset.path = tab.path;
    item.href = `#${tab.path}`;
    const glyph = document.createElement('span');
    glyph.className = 'tab-glyph';
    glyph.textContent = tab.glyph;
    const label = document.createElement('span');
    label.textContent = tab.text;
    item.append(glyph, label);
    if (tab.badge) {
      const badge = document.createElement('span');
      badge.className = 'tab-badge';
      badge.hidden = true;
      item.appendChild(badge);
    }
    el.appendChild(item);
  });

  function refresh(path) {
    const current = path || currentPath();
    el.querySelectorAll('.tab-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.path === current);
    });
    const unread = Number(getStorageSync('roomie_unread')) || 0;
    const badge = el.querySelector('.tab-badge');
    if (badge) {
      badge.hidden = !(unread > 0);
      badge.textContent = unread > 99 ? '99+' : String(unread);
    }
  }

  const offChange = onChange(refresh);
  refresh();

  container.appendChild(el);

  return {
    el,
    refresh,
    destroy() {
      offChange();
      el.remove();
    }
  };
}

export default createTabbar;
