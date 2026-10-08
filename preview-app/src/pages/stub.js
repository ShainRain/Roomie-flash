/**
 * Stub page factory — header + tabbar + page title + 建设中 placeholder card.
 * Used by the routed pages that become functional in Phase 3+.
 * Mounts/unmounts cleanly through the router.
 */
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';

export function makeStubPage({ title, subtitle, en, note, live = false }) {
  return {
    mount(container, ctx = {}) {
      const page = document.createElement('div');
      page.className = 'page page-scroll';
      const header = createHeader(page, {
        subtitle: '深夜放映室 · 0731',
        avatar: 'M',
        live,
        pageTitle: title,
        pageSubtitle: en || ''
      });
      const wrap = document.createElement('div');
      wrap.className = 'stub-wrap';
      const card = document.createElement('div');
      card.className = 'card stub-card';
      const tag = document.createElement('span');
      tag.className = 'pill pill-amber stub-tag';
      tag.textContent = '建设中';
      const h = document.createElement('div');
      h.className = 'paper-title';
      h.textContent = `${title} · Phase 3`;
      const sub = document.createElement('div');
      sub.className = 'paper-sub';
      const peer = ctx.query && ctx.query.peer ? `（参数 peer=${ctx.query.peer}）` : '';
      sub.textContent = `${subtitle}${peer}`;
      card.append(tag, h, sub);
      if (note) {
        const n = document.createElement('div');
        n.className = 'paper-sub';
        n.textContent = note;
        card.appendChild(n);
      }
      wrap.appendChild(card);
      page.appendChild(wrap);
      const tabbar = createTabbar(page);
      container.appendChild(page);
      this._ctx = { page, header, tabbar };
    },
    unmount() {
      if (!this._ctx) return;
      this._ctx.tabbar.destroy();
      this._ctx.header.destroy();
      this._ctx.page.remove();
      this._ctx = null;
    }
  };
}
