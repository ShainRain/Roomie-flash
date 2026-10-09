/**
 * profile — FUNCTIONAL port of miniprogram/pages/profile
 * 我的放映室 = 私人收藏档案：房间 hero（live RoomScene，读当前 roomie_room）+
 * 身份浮层 + 形象定制（头像/服装双槽位，adapters/avatar.js）+ 唱片墙 24 选 12
 * （state/records.js 唯一数据源，roomie_records）+ 成就 + 房间档案。
 */
import './profile.css';
import { createHeader } from '../components/header/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import RoomScene from '../components/room-scene/index.js';
import RoomStore from '../state/room.js';
import Player from '../state/player.js';
import { RECORDS, readSelection, MAX_PICK } from '../state/records.js';
import { toggleSelection } from '../state/record-pick.js';
import { VIGNETTE_CHAR_AT, VIGNETTE_CHAR_PLAN } from '../state/friends.js';
import Avatar from '../adapters/avatar.js';
import { assetUrl } from '../utils/asset-url.js';
import { getStorageSync, setStorageSync } from '../adapters/storage.js';
import { showToast, showModal } from '../adapters/platform.js';
import { navigate } from '../router/router.js';

const FLOOR_NAMES = { 'blue-gray': '夜蓝灰', walnut: '胡桃木', slate: '深石板' };

const USER = { name: 'MOMO', level: 7, badge: '建筑师', roomId: '0731', roomName: '深夜放映室' };

const ACHIEVEMENTS = [
  { name: '新晋达人', lv: 3, color: '#F0A93C', glyph: '♪' },
  { name: '建筑师傅', lv: 4, color: '#8A5A33', glyph: '⚒' },
  { name: '愈音之友', lv: 2, color: '#3B4A6B', glyph: '✦' }
];

export function mount(container) {
  const room = RoomStore.getRoom();
  // 唱片墙选择：draft = 当前生效选择（readSelection 自带非法 id 过滤 + 空回退默认）
  let selected = readSelection(getStorageSync);
  let dirty = false;
  const PICK_OPTS = { maxPick: MAX_PICK, maxId: RECORDS.length };

  const page = document.createElement('div');
  page.className = 'p-profile page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  const header = createHeader(scroller, {
    subtitle: `${USER.roomName} · ${USER.roomId}`,
    avatar: USER.name[0],
    live: false
  });

  const pad = document.createElement('div');
  pad.className = 'page-pad';
  scroller.appendChild(pad);

  // ---- 编辑式刊头 ----
  const masthead = document.createElement('div');
  masthead.className = 'pf-masthead anim-in';
  const mtText = document.createElement('div');
  mtText.className = 'pf-masthead-text';
  const mtTitle = document.createElement('span');
  mtTitle.className = 'pf-masthead-title';
  mtTitle.textContent = '我的放映室';
  const mtEn = document.createElement('span');
  mtEn.className = 'en-serif pf-masthead-en';
  mtEn.textContent = 'My Room';
  mtText.append(mtTitle, mtEn);
  const gear = document.createElement('button');
  gear.className = 'pf-masthead-gear';
  gear.textContent = '⚙';
  gear.addEventListener('click', () => showToast({ title: '设置 · 即将上线', icon: 'none' }));
  masthead.append(mtText, gear);
  pad.appendChild(masthead);

  // ---- Personal Room Hero：live RoomScene（当前 roomie_room 实时反映 Architect 修改） ----
  const hero = document.createElement('div');
  hero.className = 'pf-hero anim-in anim-d1';
  hero.addEventListener('click', () => navigate('/room'));
  const heroStage = document.createElement('div');
  heroStage.className = 'pf-hero-stage';
  hero.appendChild(heroStage);
  const outfit = Avatar.path('outfit');
  const scene = new RoomScene(heroStage, {
    floor: room.floor,
    lightTemp: room.lightTemp,
    lightBright: room.lightBright,
    furniture: room.furniture,
    records: readSelection(getStorageSync),
    lampOn: true,
    projectorOn: true,
    mode: 'preview',
    characters: [{
      id: 'momo',
      x: VIGNETTE_CHAR_AT.x,
      y: VIGNETTE_CHAR_AT.y,
      frame: 'idle',
      facing: 1,
      scale: VIGNETTE_CHAR_PLAN.scale,
      z: VIGNETTE_CHAR_PLAN.z,
      spriteSrc: outfit || undefined
    }]
  });
  const heroId = document.createElement('div');
  heroId.className = 'pf-hero-id';
  const heroName = document.createElement('span');
  heroName.className = 'pf-hero-name';
  heroName.textContent = USER.name;
  const lvPill = document.createElement('span');
  lvPill.className = 'pill pill-dark';
  lvPill.textContent = `Lv.${USER.level}`;
  const badgePill = document.createElement('span');
  badgePill.className = 'pill pill-amber';
  badgePill.textContent = USER.badge;
  heroId.append(heroName, lvPill, badgePill);
  const heroRoom = document.createElement('span');
  heroRoom.className = 'pf-hero-room pill pill-dark';
  heroRoom.textContent = `${USER.roomName} · ${USER.roomId}`;
  hero.append(heroId, heroRoom);
  pad.appendChild(hero);

  // ---- 形象定制（头像/服装双槽位） ----
  const dressRow = document.createElement('div');
  dressRow.className = 'pf-dress-row anim-in anim-d1';
  const btnHair = document.createElement('button');
  btnHair.className = 'btn-ghost-night pf-me-btn';
  btnHair.textContent = '换发型';
  btnHair.addEventListener('click', () => showToast({ title: '换发型 · 素材即将更新', icon: 'none' }));
  const btnOutfit = document.createElement('button');
  btnOutfit.className = 'btn-ghost-night pf-me-btn';
  btnOutfit.textContent = '换服装';
  btnOutfit.addEventListener('click', () => importSlot('outfit'));
  const btnAvatar = document.createElement('button');
  btnAvatar.className = 'btn-ghost-night pf-me-btn';
  btnAvatar.textContent = '换头像';
  btnAvatar.addEventListener('click', () => importSlot('avatar'));
  const dressAvatar = document.createElement('img');
  dressAvatar.className = 'pf-dress-avatar';
  dressAvatar.alt = '头像';
  dressAvatar.addEventListener('click', () => importSlot('avatar'));
  dressRow.append(btnHair, btnOutfit, btnAvatar, dressAvatar);
  pad.appendChild(dressRow);

  const dressMeta = document.createElement('div');
  dressMeta.className = 'pf-dress-meta anim-in anim-d1';
  const dressHint = document.createElement('span');
  dressHint.className = 'pf-dress-hint';
  const dressLinks = document.createElement('div');
  dressLinks.className = 'pf-dress-links';
  const resetLink = document.createElement('button');
  resetLink.className = 'pf-me-link pf-me-link-reset';
  resetLink.textContent = '恢复默认形象';
  resetLink.addEventListener('click', onResetAvatar);
  dressLinks.appendChild(resetLink);
  dressMeta.append(dressHint, dressLinks);
  pad.appendChild(dressMeta);

  function refreshAvatar() {
    const avatar = Avatar.read('avatar');
    const outfitRec = Avatar.read('outfit');
    dressAvatar.src = avatar ? avatar.path : '';
    dressAvatar.style.display = avatar ? '' : 'none';
    dressHint.textContent = `头像：${avatar ? `已导入 ${avatar.name}` : '默认'} · 服装：${outfitRec ? `已导入 ${outfitRec.name}` : '默认（房间里是 MOMO 团子）'}`;
    resetLink.style.display = (avatar || outfitRec) ? '' : 'none';
    // 服装变化即刻反映到 hero 角色
    scene.setProps({
      characters: [{
        id: 'momo',
        x: VIGNETTE_CHAR_AT.x,
        y: VIGNETTE_CHAR_AT.y,
        frame: 'idle',
        facing: 1,
        scale: VIGNETTE_CHAR_PLAN.scale,
        z: VIGNETTE_CHAR_PLAN.z,
        spriteSrc: Avatar.path('outfit') || undefined
      }]
    });
  }

  async function importSlot(slot) {
    const picked = await Avatar.pickImage();
    if (!picked) return; // 用户取消，不打扰
    const check = Avatar.validate(picked.file && picked.file.size);
    if (!check.ok) {
      showToast({ title: check.reason, icon: 'none', duration: 2600 });
      return;
    }
    try {
      Avatar.save(slot, picked.dataUrl, picked.file);
      refreshAvatar();
      showToast({
        title: slot === 'outfit' ? '服装已更新，去房间看看' : '头像已更新',
        icon: 'none',
        duration: 2000
      });
    } catch (e) {
      showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }

  function onResetAvatar() {
    showModal({
      title: '恢复默认形象？',
      content: '头像与服装都会回到默认状态。',
      confirmText: '恢复默认'
    }).then((res) => {
      if (!res.confirm) return;
      Avatar.clear('avatar');
      Avatar.clear('outfit');
      refreshAvatar();
      showToast({ title: '已恢复默认形象', icon: 'none' });
    });
  }

  // ---- 纸张档案卡 ----
  const sheet = document.createElement('div');
  sheet.className = 'card pf-sheet anim-in anim-d2';
  pad.appendChild(sheet);

  // 我的唱片墙
  const wallHead = document.createElement('div');
  wallHead.className = 'pf-sec-head';
  const wallTitle = document.createElement('span');
  wallTitle.className = 'paper-title';
  wallTitle.textContent = '我的唱片墙';
  const wallCount = document.createElement('span');
  wallCount.className = 'wall-count';
  wallHead.append(wallTitle, wallCount);
  const wallDesc = document.createElement('span');
  wallDesc.className = 'wall-desc';
  wallDesc.textContent = `从收藏的 ${RECORDS.length} 张唱片中挑选，挂在房间的墙上`;
  const wallTip = document.createElement('div');
  wallTip.className = 'wall-tip';
  wallTip.textContent = '还没有选唱片 —— 点下面的唱片，把喜欢的声音挂上墙';
  const grid = document.createElement('div');
  grid.className = 'wall-grid';
  const cellEls = new Map();
  RECORDS.forEach((r) => {
    const cell = document.createElement('button');
    cell.className = 'rec';
    const cover = document.createElement('img');
    cover.className = 'rec-cover';
    cover.src = assetUrl(`/assets/img/cover-${r.id}.webp`);
    cover.alt = r.title;
    const title = document.createElement('span');
    title.className = 'rec-title';
    title.textContent = r.title;
    const check = document.createElement('span');
    check.className = 'rec-check';
    check.textContent = '✓';
    cell.append(cover, title, check);
    cell.addEventListener('click', () => toggleRecord(r.id));
    cellEls.set(r.id, cell);
    grid.appendChild(cell);
  });
  const addCell = document.createElement('div');
  addCell.className = 'rec rec-add';
  const plus = document.createElement('span');
  plus.className = 'rec-add-plus';
  plus.textContent = '+';
  addCell.appendChild(plus);
  grid.appendChild(addCell);
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary save-wall';
  saveBtn.addEventListener('click', onSave);
  sheet.append(wallHead, wallDesc, wallTip, grid, saveBtn);

  sheet.appendChild(Object.assign(document.createElement('div'), { className: 'pf-sheet-line' }));

  // 我的成就
  const achHead = document.createElement('div');
  achHead.className = 'pf-sec-head';
  const achTitle = document.createElement('span');
  achTitle.className = 'paper-title';
  achTitle.textContent = '我的成就';
  achHead.appendChild(achTitle);
  const achRow = document.createElement('div');
  achRow.className = 'ach-row';
  ACHIEVEMENTS.forEach((a) => {
    const el = document.createElement('div');
    el.className = 'ach';
    const ic = document.createElement('div');
    ic.className = 'ach-ic';
    ic.style.background = a.color;
    ic.textContent = a.glyph;
    const nm = document.createElement('span');
    nm.className = 'ach-name';
    nm.textContent = a.name;
    const lv = document.createElement('span');
    lv.className = 'ach-lv';
    lv.textContent = `Lv.${a.lv}`;
    el.append(ic, nm, lv);
    achRow.appendChild(el);
  });
  sheet.append(achHead, achRow);

  sheet.appendChild(Object.assign(document.createElement('div'), { className: 'pf-sheet-line' }));

  // 房间档案（状态，而非第二张缩略图）
  const roomHead = document.createElement('div');
  roomHead.className = 'pf-sec-head';
  const roomTitle = document.createElement('span');
  roomTitle.className = 'paper-title';
  roomTitle.textContent = '房间档案';
  roomHead.appendChild(roomTitle);
  const roomRow = document.createElement('div');
  roomRow.className = 'pf-room-row';
  roomRow.addEventListener('click', () => navigate('/room'));
  const roomMeta = document.createElement('div');
  roomMeta.className = 'pf-room-meta';
  const roomNow = document.createElement('span');
  roomNow.className = 'pf-room-now';
  roomNow.textContent = `当前使用 · ${USER.roomName}`;
  const roomSub = document.createElement('span');
  roomSub.className = 'pf-room-sub';
  roomSub.textContent = `${FLOOR_NAMES[room.floor] || room.floor}地板 · ${room.lightTemp}K 暖光 · ${room.furniture.length} 件家具`;
  roomMeta.append(roomNow, roomSub);
  const roomArrow = document.createElement('span');
  roomArrow.className = 'pf-room-arrow';
  roomArrow.textContent = '›';
  roomRow.append(roomMeta, roomArrow);
  sheet.append(roomHead, roomRow);

  const tabbar = createTabbar(page);
  container.appendChild(page);

  // ---- 唱片墙渲染 ----
  function renderWall() {
    wallCount.textContent = `已选 ${selected.length} / ${MAX_PICK}`;
    wallTip.style.display = selected.length === 0 ? '' : 'none';
    cellEls.forEach((cell, id) => {
      const on = selected.includes(id);
      cell.classList.toggle('rec-on', on);
      cell.querySelector('.rec-check').style.display = on ? '' : 'none';
    });
    saveBtn.classList.toggle('save-done', !dirty);
    saveBtn.textContent = dirty ? '保存布置' : '已保存';
  }

  function toggleRecord(id) {
    const rec = RECORDS.find((r) => r.id === id);
    // 真实音频唱片：点击是「播放」入口——只挂上墙不摘下，同时链接播放对应音频
    if (rec && rec.audio && rec.trackId) {
      if (!selected.includes(id)) {
        const add = toggleSelection(selected, id, PICK_OPTS);
        if (add.blocked === 'max') {
          showToast({ title: `最多挂 ${MAX_PICK} 张`, icon: 'none' });
        } else {
          selected = add.next;
          dirty = true;
          renderWall();
        }
      }
      Player.playTrack(rec.trackId, true);
      showToast({ title: `♪ 正在播放《${rec.title}》`, icon: 'none' });
      return;
    }
    // 普通唱片：点选切换（与 #/records 页同一套规则：上限拦截/非法 id 忽略）
    const res = toggleSelection(selected, id, PICK_OPTS);
    if (res.blocked === 'max') {
      showToast({ title: `最多挂 ${MAX_PICK} 张`, icon: 'none' });
      return;
    }
    selected = res.next;
    dirty = true;
    renderWall();
  }

  // 保存：draft → roomie_records（schema 不变；Room/Home 下次读取即生效）
  function onSave() {
    setStorageSync('roomie_records', selected.slice());
    dirty = false;
    renderWall();
    showToast({ title: '唱片墙已保存', icon: 'success' });
  }

  refreshAvatar();
  renderWall();

  return {
    unmount() {
      scene.destroy();
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
