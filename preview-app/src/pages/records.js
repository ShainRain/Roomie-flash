/**
 * records — 独立唱片选择页 #/records（?focus=<id> 可定位到某张唱片）。
 * 房间唱片墙热点入口；与个人页「我的唱片墙」共用同一数据源与交互规则：
 * state/records.js（RECORDS/MAX_PICK/readSelection + roomie_records）+
 * state/record-pick.js（sanitizeSelection/toggleSelection 纯逻辑）。
 *
 * 语义：点选只改页面草稿，「保存并挂墙」才写入 roomie_records 并返回房间
 * （hash 路由重挂载 room，refreshRoomConfig 读到的即是新选择，墙面即时一致）。
 * 选择 ≠ 播放：点选不触发播放；真实音频唱片（Peaceful）带独立试听入口，
 * 经全局 Player.playTrack 播放。返回时如有未保存修改先确认，绝不静默覆盖。
 */
import './records.css';
import { RECORDS, MAX_PICK, readSelection } from '../state/records.js';
import { sanitizeSelection, toggleSelection } from '../state/record-pick.js';
import { getStorageSync, setStorageSync } from '../adapters/storage.js';
import { showToast, showModal } from '../adapters/platform.js';
import { back, navigate } from '../router/router.js';
import Player from '../state/player.js';
import { assetUrl } from '../utils/asset-url.js';

export function mount(container, ctx = {}) {
  const opts = { maxPick: MAX_PICK, maxId: RECORDS.length };
  // 草稿初始 = 当前生效选择（readSelection 过滤非法 id + 空回退默认；sanitize 去重/截断）
  let saved = sanitizeSelection(readSelection(getStorageSync), opts);
  let draft = saved.slice();
  let dirty = false;

  const focusRaw = ctx.query && ctx.query.focus;
  const focusId = Number(focusRaw);

  const page = document.createElement('div');
  page.className = 'p-records page';

  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  // ---- 顶部：返回 + 双语标题 ----
  const topbar = document.createElement('div');
  topbar.className = 'rp-topbar';
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-ic';
  backBtn.textContent = '‹';
  backBtn.setAttribute('aria-label', '返回');
  backBtn.addEventListener('click', onBack);
  const titleWrap = document.createElement('div');
  titleWrap.className = 'rp-title';
  const titleCn = document.createElement('span');
  titleCn.className = 'rp-title-cn';
  titleCn.textContent = '我的唱片墙';
  const titleEn = document.createElement('span');
  titleEn.className = 'rp-title-en en-serif';
  titleEn.textContent = 'RECORDS';
  titleWrap.append(titleCn, titleEn);
  topbar.append(backBtn, titleWrap);
  scroller.appendChild(topbar);

  const pad = document.createElement('div');
  pad.className = 'page-pad';
  scroller.appendChild(pad);

  // ---- 说明 + 已选计数 ----
  const head = document.createElement('div');
  head.className = 'rp-head';
  const desc = document.createElement('span');
  desc.className = 'rp-desc';
  desc.textContent = `从收藏的 ${RECORDS.length} 张唱片中挑选，挂在房间墙上`;
  const count = document.createElement('span');
  count.className = 'rp-count';
  head.append(desc, count);

  const tip = document.createElement('div');
  tip.className = 'rp-tip';
  tip.textContent = '还没有选唱片 —— 点下面的唱片，把喜欢的声音挂上墙';

  pad.append(head, tip);

  // ---- 唱片网格 ----
  const grid = document.createElement('div');
  grid.className = 'rp-grid';
  const cellEls = new Map();
  RECORDS.forEach((r) => {
    const cell = document.createElement('button');
    cell.className = 'rp-cell';
    cell.dataset.id = String(r.id);
    const cover = document.createElement('img');
    cover.className = 'rp-cover';
    cover.src = assetUrl(`/assets/img/cover-${r.id}.webp`);
    cover.alt = r.title;
    const title = document.createElement('span');
    title.className = 'rp-name';
    title.textContent = r.title;
    const check = document.createElement('span');
    check.className = 'rp-check';
    check.textContent = '✓';
    cell.append(cover, title, check);
    // 真实音频唱片：独立试听入口（选择仍是点选本体，二者互不触发）
    if (r.audio && r.trackId) {
      const play = document.createElement('span');
      play.className = 'rp-play';
      play.textContent = '▶';
      play.setAttribute('role', 'button');
      play.setAttribute('aria-label', `试听《${r.title}》`);
      play.addEventListener('click', (e) => {
        e.stopPropagation();
        Player.playTrack(r.trackId, true);
        showToast({ title: `♪ 正在试听《${r.title}》`, icon: 'none' });
      });
      cell.appendChild(play);
    }
    cell.addEventListener('click', () => onToggle(r.id));
    cellEls.set(r.id, cell);
    grid.appendChild(cell);
  });
  pad.appendChild(grid);

  // ---- 底部操作条 ----
  const actions = document.createElement('div');
  actions.className = 'rp-actions';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn-ghost-night rp-reset';
  resetBtn.textContent = '取消修改';
  resetBtn.addEventListener('click', onReset);
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary rp-save';
  saveBtn.addEventListener('click', onSave);
  actions.append(resetBtn, saveBtn);
  scroller.appendChild(actions);

  container.appendChild(page);

  // ---- 渲染 ----
  function render() {
    count.textContent = `已选 ${draft.length} / ${MAX_PICK}`;
    tip.style.display = draft.length === 0 ? '' : 'none';
    cellEls.forEach((cell, id) => {
      cell.classList.toggle('rp-on', draft.includes(id));
      cell.querySelector('.rp-check').style.display = draft.includes(id) ? '' : 'none';
    });
    saveBtn.classList.toggle('save-done', !dirty);
    saveBtn.textContent = dirty ? `保存并挂墙（${draft.length} 张）` : '已保存';
  }

  function onToggle(id) {
    const res = toggleSelection(draft, id, opts);
    if (res.blocked === 'max') {
      showToast({ title: `最多挂 ${MAX_PICK} 张，先摘下一张再试`, icon: 'none' });
      return;
    }
    draft = res.next;
    dirty = true;
    render();
  }

  // 取消修改：草稿回滚到上次保存的选择（留在页面继续挑选）
  function onReset() {
    if (!dirty) {
      showToast({ title: '没有需要取消的修改', icon: 'none', duration: 1200 });
      return;
    }
    draft = saved.slice();
    dirty = false;
    render();
    showToast({ title: '已恢复为上次保存的唱片墙', icon: 'none' });
  }

  function onSave() {
    if (!dirty) {
      back();
      return;
    }
    setStorageSync('roomie_records', draft.slice());
    saved = draft.slice();
    dirty = false;
    render();
    navigate('/room');
    // 路由切换会清空浮层，toast 延迟到房间页再出现（保存成功的反馈）
    setTimeout(() => showToast({ title: '唱片墙已保存', icon: 'success' }), 80);
  }

  // 返回：有未保存修改时先确认，绝不静默覆盖已保存选择
  function onBack() {
    if (!dirty) {
      back();
      return;
    }
    showModal({
      title: '不保存修改？',
      content: '离开后唱片墙仍保持上次保存的样子。',
      confirmText: '离开',
      cancelText: '继续挑选'
    }).then((res) => {
      if (res.confirm) back();
    });
  }

  render();

  // ---- ?focus= 定位（消息页「查看唱片」深链）：滚动到对应唱片并短暂高亮 ----
  if (Number.isInteger(focusId) && focusId >= 1 && focusId <= RECORDS.length) {
    const target = cellEls.get(focusId);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        target.classList.add('rp-focus');
        setTimeout(() => target.classList.remove('rp-focus'), 1800);
      });
    }
  } else if (focusRaw !== undefined) {
    showToast({ title: '找不到这张唱片，已为你展示全部收藏', icon: 'none' });
  }

  return {
    unmount() {
      page.remove();
    }
  };
}

let ctx = null;

export default {
  mount(container, ctxArg) {
    ctx = mount(container, ctxArg);
  },
  unmount() {
    if (ctx) {
      ctx.unmount();
      ctx = null;
    }
  }
};
