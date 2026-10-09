/**
 * messages — Roomie 互动收件箱：「谁向我发来了什么，我需要回应什么」。
 * 分类筛选（全部/待回应/唱片与明信片/房间动态）+ 四类事件：
 *   invite    邀请卡（接受/拒绝，状态持久化，接受进双人放映室）
 *   share     唱片分享卡（真实封面 + 推荐语 → #/records?focus= 定位）
 *   postcard  明信片（mock 数据 + modal 详情阅读）
 *   event     房间互动事件（紧凑列表，操作按业务分流：进房间/看唱片墙）
 * 已读/未读沿用 roomie_messages_read + roomie_unread（tabbar 角标唯一来源）；
 * 邀请决定持久化到 roomie_invite_states。纯逻辑见 state/messages.js。
 */
import './messages.css';
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import { getStorageSync, setStorageSync } from '../adapters/storage.js';
import { showToast, showModal } from '../adapters/platform.js';
import { navigate } from '../router/router.js';
import { assetUrl } from '../utils/asset-url.js';
import { byId } from '../state/records.js';
import {
  MESSAGE_CATEGORIES, MESSAGES,
  categoryOf, filterByCategory, countUnread,
  loadReadIds, saveReadIds, loadInviteStates, saveInviteStates,
  applyInviteStates, decideInvite, inviteStatusLabel
} from '../state/messages.js';

export function mount(container) {
  const readIds = loadReadIds(getStorageSync);
  const inviteStates = loadInviteStates(getStorageSync);
  let messages = applyInviteStates(
    MESSAGES.map((m) => ({ ...m, unread: m.unread && !readIds.has(m.id) })),
    inviteStates
  );
  let activeCategory = 'all';

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

  // ---- 分类筛选 ----
  const tabs = document.createElement('div');
  tabs.className = 'msg-tabs';
  const tabEls = new Map();
  MESSAGE_CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'msg-tab';
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      if (activeCategory === cat.id) return;
      activeCategory = cat.id;
      renderTabs();
      renderList();
    });
    tabEls.set(cat.id, btn);
    tabs.appendChild(btn);
  });
  pad.appendChild(tabs);

  const listWrap = document.createElement('div');
  pad.appendChild(listWrap);

  const tabbar = createTabbar(page);
  container.appendChild(page);

  // roomie_unread = 当前未读数（tabbar 角标唯一来源）；已读集合持久化
  function syncUnread() {
    setStorageSync('roomie_unread', countUnread(messages));
    saveReadIds(setStorageSync, messages);
    tabbar.refresh();
  }

  function markRead(id) {
    const msg = messages.find((m) => m.id === id);
    if (!msg || !msg.unread) return;
    msg.unread = false;
    syncUnread();
  }

  // ---- 事件型消息的操作按业务分流（不再一律跳 #/duo） ----
  function runEventAction(m) {
    const kind = m.action && m.action.kind;
    if (kind === 'room') navigate('/room');
    else if (kind === 'records') navigate('/records');
    else if (kind === 'records-focus') navigate(`/records?focus=${m.action.recordId}`);
    else if (kind === 'duo') navigate(`/duo?peer=${m.from}`);
  }

  function runShareAction(m) {
    if (m.recordId && byId(m.recordId)) navigate(`/records?focus=${m.recordId}`);
    else navigate('/records');
  }

  function openPostcard(m) {
    showModal({
      title: `来自 ${m.from} 的明信片`,
      content: m.content || m.preview || '',
      confirmText: '收好了',
      showCancel: false
    });
  }

  function decide(m, decision) {
    const res = decideInvite(messages, m.id, decision);
    if (!res.ok) {
      if (res.reason === 'already-decided') showToast({ title: '这条邀请已经回应过了', icon: 'none' });
      return;
    }
    messages = res.next;
    inviteStates[m.id] = decision;
    saveInviteStates(setStorageSync, inviteStates);
    markRead(m.id);
    renderList();
    if (decision === 'accepted') {
      showToast({ title: `已接受 ${m.from} 的邀请，正在进入放映室`, icon: 'success' });
      navigate(`/duo?peer=${m.from}`);
    } else {
      showToast({ title: `已婉拒 ${m.from} 的邀请`, icon: 'none' });
    }
  }

  // ---- 渲染 ----
  function renderTabs() {
    tabEls.forEach((el, id) => {
      el.classList.toggle('msg-tab-on', id === activeCategory);
    });
  }

  function renderList() {
    listWrap.innerHTML = '';
    const items = filterByCategory(messages, activeCategory);
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'card msg-empty anim-in';
      empty.innerHTML = `
        <div class="empty-mark"><div class="empty-dot"></div></div>
        <span class="empty-title">这个分类暂时没有消息</span>
        <span class="empty-sub">好友的邀请、唱片分享和明信片会出现在这里</span>`;
      listWrap.appendChild(empty);
      return;
    }
    items.forEach((m) => {
      if (m.type === 'invite') listWrap.appendChild(renderInvite(m));
      else if (m.type === 'share') listWrap.appendChild(renderShare(m));
      else if (m.type === 'postcard') listWrap.appendChild(renderPostcard(m));
      else listWrap.appendChild(renderEvent(m));
    });
  }

  function avatarEl(m) {
    const avatar = document.createElement('div');
    avatar.className = 'm-avatar';
    avatar.style.background = m.color;
    avatar.textContent = m.from[0];
    if (m.unread) {
      const dot = document.createElement('span');
      dot.className = 'm-unread';
      avatar.appendChild(dot);
    }
    return avatar;
  }

  function headRow(m) {
    const row = document.createElement('div');
    row.className = 'mc-head';
    row.appendChild(avatarEl(m));
    const meta = document.createElement('div');
    meta.className = 'mc-meta';
    const r = document.createElement('div');
    r.className = 'm-row';
    const name = document.createElement('span');
    name.className = 'm-name';
    name.textContent = m.from;
    const time = document.createElement('span');
    time.className = 'm-time';
    time.textContent = m.time;
    r.append(name, time);
    const kind = document.createElement('span');
    kind.className = 'mc-kind';
    kind.textContent = m.type === 'invite' ? '一起听邀请' : m.type === 'share' ? '唱片推荐' : '明信片';
    meta.append(r, kind);
    row.appendChild(meta);
    return row;
  }

  function recordStrip(m) {
    const rec = m.recordId ? byId(m.recordId) : null;
    const strip = document.createElement('div');
    strip.className = 'mc-record';
    if (rec) {
      const cover = document.createElement('img');
      cover.className = 'mc-cover';
      cover.src = assetUrl(`/assets/img/cover-${rec.id}.webp`);
      cover.alt = rec.title;
      strip.appendChild(cover);
    }
    const txt = document.createElement('div');
    txt.className = 'mc-record-txt';
    const t = document.createElement('span');
    t.className = 'mc-record-title';
    t.textContent = rec ? `《${rec.title}》` : m.title;
    txt.appendChild(t);
    if (m.body) {
      const body = document.createElement('span');
      body.className = 'mc-record-body';
      body.textContent = m.body;
      txt.appendChild(body);
    }
    if (m.quote) {
      const quote = document.createElement('span');
      quote.className = 'mc-quote';
      quote.textContent = `“${m.quote}”`;
      txt.appendChild(quote);
    }
    strip.appendChild(txt);
    return strip;
  }

  // A. 邀请卡：待回应突出双按钮；已决定显示状态 + 进入放映室
  function renderInvite(m) {
    const card = document.createElement('div');
    card.className = 'card msg-card msg-invite anim-in';
    card.appendChild(headRow(m));
    card.appendChild(recordStrip(m));
    const foot = document.createElement('div');
    foot.className = 'mc-actions';
    if (m.status === 'pending') {
      const decline = document.createElement('button');
      decline.className = 'mc-btn mc-btn-ghost';
      decline.textContent = '拒绝';
      decline.addEventListener('click', (e) => { e.stopPropagation(); decide(m, 'declined'); });
      const accept = document.createElement('button');
      accept.className = 'mc-btn mc-btn-solid';
      accept.textContent = '接受';
      accept.addEventListener('click', (e) => { e.stopPropagation(); decide(m, 'accepted'); });
      foot.append(decline, accept);
    } else {
      const status = document.createElement('span');
      status.className = `mc-status${m.status === 'accepted' ? ' mc-status-ok' : ''}`;
      status.textContent = inviteStatusLabel(m.status);
      foot.appendChild(status);
      if (m.status === 'accepted') {
        const enter = document.createElement('button');
        enter.className = 'mc-btn mc-btn-ghost';
        enter.textContent = '进入放映室';
        enter.addEventListener('click', (e) => { e.stopPropagation(); navigate(`/duo?peer=${m.from}`); });
        foot.appendChild(enter);
      }
    }
    card.appendChild(foot);
    card.addEventListener('click', () => markRead(m.id));
    return card;
  }

  // B. 唱片分享卡：真实封面 + 推荐语 → 唱片页定位
  function renderShare(m) {
    const card = document.createElement('div');
    card.className = 'card msg-card msg-share anim-in';
    card.appendChild(headRow(m));
    card.appendChild(recordStrip(m));
    const foot = document.createElement('div');
    foot.className = 'mc-actions';
    const view = document.createElement('button');
    view.className = 'mc-btn mc-btn-solid';
    view.textContent = '查看唱片';
    view.addEventListener('click', (e) => { e.stopPropagation(); markRead(m.id); runShareAction(m); });
    foot.appendChild(view);
    card.appendChild(foot);
    card.addEventListener('click', () => markRead(m.id));
    return card;
  }

  // C. 明信片卡：正文预览 → modal 阅读全文
  function renderPostcard(m) {
    const card = document.createElement('div');
    card.className = 'card msg-card msg-postcard anim-in';
    const stamp = document.createElement('span');
    stamp.className = 'mc-stamp';
    stamp.textContent = '✉';
    card.appendChild(stamp);
    card.appendChild(headRow(m));
    const preview = document.createElement('span');
    preview.className = 'mc-preview';
    preview.textContent = m.preview || m.content || '';
    card.appendChild(preview);
    const foot = document.createElement('div');
    foot.className = 'mc-actions';
    const read = document.createElement('button');
    read.className = 'mc-btn mc-btn-ghost';
    read.textContent = '阅读';
    read.addEventListener('click', (e) => { e.stopPropagation(); markRead(m.id); openPostcard(m); });
    foot.appendChild(read);
    card.appendChild(foot);
    card.addEventListener('click', () => { markRead(m.id); openPostcard(m); });
    return card;
  }

  // D. 房间动态：紧凑行；操作按业务含义分流
  function renderEvent(m) {
    const row = document.createElement('div');
    row.className = 'msg';
    row.dataset.id = String(m.id);
    row.appendChild(avatarEl(m));
    const info = document.createElement('div');
    info.className = 'm-info';
    const r = document.createElement('div');
    r.className = 'm-row';
    const name = document.createElement('span');
    name.className = 'm-name';
    name.textContent = m.from;
    const time = document.createElement('span');
    time.className = 'm-time';
    time.textContent = m.time;
    r.append(name, time);
    const summary = document.createElement('span');
    summary.className = 'm-summary';
    summary.textContent = m.title;
    info.append(r, summary);
    row.appendChild(info);
    if (m.action && m.action.label) {
      const btn = document.createElement('button');
      btn.className = 'm-btn';
      btn.textContent = m.action.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        markRead(m.id);
        runEventAction(m);
      });
      row.appendChild(btn);
    }
    row.addEventListener('click', () => markRead(m.id));
    return row;
  }

  renderTabs();
  renderList();
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
