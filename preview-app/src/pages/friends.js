/**
 * friends — FUNCTIONAL port of miniprogram/pages/friends
 * Vignette 横排 = 每位好友一个 RoomScene（preview 模式）实时合成的小房间：
 * 同一 Master 资产/灯光公式/等距几何，逐好友 hue/bright/sat + 角色变体
 * （语义对齐 tools/gen-friends-vignettes.js），无静态截图。
 */
import './friends.css';
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import RoomScene from '../components/room-scene/index.js';
import Player from '../state/player.js';
import RecordsUtil from '../state/records.js';
import Friends, { FRIENDS_ONLINE, FRIENDS_OFFLINE, VIGNETTE_CHAR_AT, VIGNETTE_CHAR_PLAN } from '../state/friends.js';
import { showToast, showModal } from '../adapters/platform.js';
import { navigate } from '../router/router.js';

function statusText(friend, trackTitle) {
  return friend.nowPlaying ? `${friend.status}《${trackTitle}》` : friend.status;
}

// 每位好友的唱片墙：默认选择轮转切片，vignette 之间不重样
function recordsFor(index) {
  const base = RecordsUtil.DEFAULT_SELECTION;
  return base.slice(index).concat(base.slice(0, index));
}

export function mount(container) {
  const page = document.createElement('div');
  page.className = 'p-friends page';
  // 滚动容器独立于 page：tabbar 绝对定位于 page 底部，不随内容滚动
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  const header = createHeader(scroller, {
    subtitle: '深夜放映室 · 0731',
    avatar: 'M',
    live: true,
    pageTitle: '好友',
    pageSubtitle: 'FRIENDS'
  });

  const pad = document.createElement('div');
  pad.className = 'page-pad';

  // 刊头副行
  const head = document.createElement('div');
  head.className = 'head anim-in';
  const headSub = document.createElement('span');
  headSub.className = 'head-sub';
  headSub.textContent = '夜里，每个朋友都住在自己的小房间里。';
  head.appendChild(headSub);
  pad.appendChild(head);

  // ---- 好友房间 vignette 横排（live RoomScene） ----
  const row = document.createElement('div');
  row.className = 'v-row anim-in anim-d1';
  const scenes = [];
  const vignetteActs = [];
  const vignetteStatus = [];

  FRIENDS_ONLINE.forEach((friend, i) => {
    const card = document.createElement('div');
    card.className = 'v-card';

    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'v-scene';
    const stage = document.createElement('div');
    stage.className = 'v-stage';
    if (friend.variant.filter) stage.style.filter = friend.variant.filter;
    sceneWrap.appendChild(stage);
    card.appendChild(sceneWrap);

    const scene = new RoomScene(stage, {
      floor: friend.room.floor,
      lightTemp: friend.room.lightTemp,
      lightBright: friend.room.lightBright,
      furniture: friend.room.furniture,
      records: recordsFor(i),
      lampOn: true,
      projectorOn: true,
      mode: 'preview',
      characters: [{
        id: friend.variant.char,
        x: VIGNETTE_CHAR_AT.x,
        y: VIGNETTE_CHAR_AT.y,
        frame: 'idle',
        facing: 1,
        scale: VIGNETTE_CHAR_PLAN.scale,
        z: VIGNETTE_CHAR_PLAN.z,
        filter: friend.variant.charFilter || undefined
      }]
    });
    scenes.push(scene);

    const meta = document.createElement('div');
    meta.className = 'v-meta';
    const nameRow = document.createElement('div');
    nameRow.className = 'v-name-row';
    const dot = document.createElement('span');
    dot.className = 'v-dot';
    const name = document.createElement('span');
    name.className = 'v-name';
    name.textContent = friend.name;
    const act = document.createElement('span');
    act.className = 'v-act';
    nameRow.append(dot, name, act);
    const status = document.createElement('span');
    status.className = 'v-status';
    meta.append(nameRow, status);
    card.appendChild(meta);

    vignetteActs.push(act);
    vignetteStatus.push({ el: status, friend });

    card.addEventListener('click', () => onFriendAction(friend));
    row.appendChild(card);
  });
  pad.appendChild(row);

  // ---- 在线好友卡 ----
  const onlineCard = document.createElement('div');
  onlineCard.className = 'card friend-card online-card anim-in anim-d2';
  onlineCard.appendChild(cardHead(`在线好友 · ${FRIENDS_ONLINE.length}`, 'Online'));
  const onlineStatus = [];
  const onlineBtns = [];
  FRIENDS_ONLINE.forEach((friend) => {
    const { rowEl, statusEl, btnEl } = friendRow(friend, { online: true });
    onlineStatus.push({ el: statusEl, friend });
    onlineBtns.push(btnEl);
    onlineCard.appendChild(rowEl);
  });
  pad.appendChild(onlineCard);

  // ---- 离线好友卡（区块整体降不透明度） ----
  const offlineCard = document.createElement('div');
  offlineCard.className = 'card friend-card offline-card anim-in anim-d3';
  offlineCard.appendChild(cardHead(`离线好友 · ${FRIENDS_OFFLINE.length}`, 'Offline'));
  FRIENDS_OFFLINE.forEach((friend) => {
    const { rowEl } = friendRow(friend, { online: false });
    offlineCard.appendChild(rowEl);
  });
  pad.appendChild(offlineCard);

  // ---- 邀请 CTA ----
  const cta = document.createElement('button');
  cta.className = 'btn-primary invite-cta anim-in anim-d4';
  cta.innerHTML = '<span class="invite-cta-label">邀请好友进房间</span><span class="invite-cta-arrow">→</span>';
  cta.addEventListener('click', () => showToast({ title: '邀请链接已复制（演示）', icon: 'none' }));
  pad.appendChild(cta);

  scroller.appendChild(pad);
  const tabbar = createTabbar(page);
  container.appendChild(page);

  // ---- 状态联动 ----
  function refreshInviting(inviting) {
    vignetteActs.forEach((el, i) => {
      const f = FRIENDS_ONLINE[i];
      const waiting = inviting === f.name;
      el.textContent = waiting ? '等待中…' : (f.type === 'enter' ? '进入' : '来坐坐');
      el.classList.toggle('v-act-wait', waiting);
    });
    onlineBtns.forEach((el, i) => {
      const f = FRIENDS_ONLINE[i];
      const waiting = inviting === f.name;
      el.textContent = waiting ? '等待中…' : f.action;
      el.classList.toggle('f-btn-wait', waiting);
    });
  }

  function refreshTrack(snap) {
    vignetteStatus.forEach(({ el, friend }) => { el.textContent = statusText(friend, snap.track.title); });
    onlineStatus.forEach(({ el, friend }) => { el.textContent = `在线 · ${statusText(friend, snap.track.title)}`; });
  }

  function onFriendAction(friend) {
    if (friend.type === 'offline') {
      showToast({ title: `${friend.name} 不在线，改天再来坐坐`, icon: 'none' });
      return;
    }
    if (friend.type === 'enter') {
      navigate(`/duo?peer=${friend.name}`);
      return;
    }
    if (Friends.getInviting()) return; // 已有邀请在飞
    const p = Friends.invite(friend.name, { delay: 1500 });
    if (!p) return;
    showToast({ title: `已邀请 ${friend.name}，等待接受…`, icon: 'none' });
    p.then((accepted) => {
      if (!accepted) return;
      showModal({
        title: '邀请已接受',
        content: `${accepted} 接受了你的邀请，进入双人放映室？`,
        confirmText: '进入房间',
        success: (res) => {
          if (res.confirm) navigate(`/duo?peer=${accepted}`);
        }
      });
    });
  }

  const unsubPlayer = Player.subscribe(refreshTrack);
  const unsubInviting = Friends.subscribeInviting(refreshInviting);
  refreshInviting(Friends.getInviting());

  return {
    unmount() {
      unsubPlayer();
      unsubInviting();
      Friends.cancelInvite();
      scenes.forEach((s) => s.destroy());
      tabbar.destroy();
      header.destroy();
      page.remove();
    }
  };

  // ---- helpers ----
  function cardHead(title, en) {
    const el = document.createElement('div');
    el.className = 'card-head';
    const t = document.createElement('span');
    t.className = 'paper-title';
    t.textContent = title;
    const e = document.createElement('span');
    e.className = 'card-head-en en-serif';
    e.textContent = en;
    el.append(t, e);
    return el;
  }

  function friendRow(friend, { online }) {
    const rowEl = document.createElement('div');
    rowEl.className = 'friend';

    const avatar = document.createElement('div');
    avatar.className = 'f-avatar';
    avatar.style.background = friend.color;
    avatar.textContent = friend.name[0];
    if (online) {
      const dot = document.createElement('span');
      dot.className = 'f-dot';
      avatar.appendChild(dot);
    }

    const info = document.createElement('div');
    info.className = 'f-info';
    const nameRow = document.createElement('div');
    nameRow.className = 'f-name-row';
    const name = document.createElement('span');
    name.className = 'f-name';
    name.textContent = friend.name;
    nameRow.appendChild(name);
    if (friend.tag) {
      const tag = document.createElement('span');
      tag.className = 'f-tag';
      tag.textContent = friend.tag;
      nameRow.appendChild(tag);
    }
    const status = document.createElement('span');
    status.className = 'f-status';
    status.textContent = online ? `在线 · ${statusText(friend, Player.snapshot().track.title)}` : friend.status;
    info.append(nameRow, status);

    const btn = document.createElement('button');
    btn.className = `f-btn ${online ? 'f-btn-solid' : 'f-btn-ghost'}`;
    btn.textContent = friend.action;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onFriendAction(friend);
    });

    rowEl.append(avatar, info, btn);
    if (!online) rowEl.addEventListener('click', () => onFriendAction(friend));
    return { rowEl, statusEl: status, btnEl: btn };
  }
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
