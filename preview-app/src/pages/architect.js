/**
 * architect — FUNCTIONAL port of miniprogram/pages/architect
 * 建筑师模式：在自己的私人放映室里重新安排家具、地板和灯光。
 *
 * 编辑模型（saved vs draft）：
 *   savedRoomState = state/room.js 的 roomie_room（唯一持久化通道）
 *   draftRoomState = 本页工作副本（进入时从 saved 初始化；所有编辑只改 draft
 *                    并实时驱动预览；保存才写回 store；放弃=离开即丢弃，
 *                    小程序无退出确认/草稿持久化，如实移植）
 * 预览：RoomScene 'preview' 模式实时绑定 draft（家具显隐/地板 tint/灯光层公式）。
 * 家具库与 Master 单一数据源同源（FURNITURE 非 fixed 项 + furn-thumb-* 缩略图）。
 */
import './architect.css';
import RoomScene from '../components/room-scene/index.js';
import { createTabbar } from '../components/tabbar/index.js';
import SceneLayout from '../shared/room-scene-layout.js';
import RoomStore from '../state/room.js';
import Player from '../state/player.js';
import RecordsUtil from '../state/records.js';
import { getStorageSync } from '../adapters/storage.js';
import { showToast } from '../adapters/platform.js';
import { assetUrl } from '../utils/asset-url.js';

const FLOORS = [
  { key: 'blue-gray', name: '夜蓝灰', color: '#3B4A6B' },
  { key: 'walnut', name: '胡桃木', color: '#8A5A33' },
  { key: 'slate', name: '深石板', color: '#4A5A66' }
];

// 家具库与 Room Master 单一数据源同源；table 为 fixed（不出现在可选清单）
const FURNITURE = SceneLayout.FURNITURE
  .filter((f) => !f.fixed)
  .map((f) => ({ key: f.id, name: f.label, thumb: f.thumb }));

const TABS = [
  { key: 'furniture', name: '家具', short: '具' },
  { key: 'floor', name: '地板', short: '板' },
  { key: 'light', name: '灯光', short: '光' }
];

export function mount(container) {
  // savedRoomState → draftRoomState
  const saved = RoomStore.getRoom();
  const draft = {
    floor: saved.floor,
    lightTemp: saved.lightTemp,
    lightBright: saved.lightBright,
    furniture: saved.furniture.slice()
  };
  let dirty = false;
  let activeTab = 'furniture';
  // 对齐小程序：预览的 nowPlaying 为固定演示值（architect 不接 Player）
  const recordIds = RecordsUtil.readSelection(getStorageSync);

  const page = document.createElement('div');
  page.className = 'p-arch page';
  const scroller = document.createElement('div');
  scroller.className = 'page-scroll';
  page.appendChild(scroller);

  // ---- 刊头 + 保存 CTA ----
  const head = document.createElement('div');
  head.className = 'page-pad rise';
  const headRow = document.createElement('div');
  headRow.className = 'arch-head-row';
  const headText = document.createElement('div');
  headText.className = 'arch-head-text';
  const masthead = document.createElement('span');
  masthead.className = 'arch-masthead';
  masthead.textContent = '建筑师模式';
  const headEn = document.createElement('span');
  headEn.className = 'en-serif arch-head-en';
  headEn.textContent = 'Architect Studio';
  headText.append(masthead, headEn);
  const saveBtn = document.createElement('button');
  saveBtn.addEventListener('click', onSave);
  headRow.append(headText, saveBtn);
  head.appendChild(headRow);
  scroller.appendChild(head);

  // ---- 房间预览（live，绑定 draft） ----
  const preview = document.createElement('div');
  preview.className = 'arch-preview page-pad rise rise-1';
  const frame = document.createElement('div');
  frame.className = 'preview-frame';
  preview.appendChild(frame);
  const previewTag = document.createElement('div');
  previewTag.className = 'preview-tag pill pill-live';
  // 对齐小程序"预览为固定演示值"的语义，但取自当前歌单首曲（合法器乐迁移后无版权标题）
  previewTag.textContent = `正在播放 · ${Player.snapshot().track.title}`;
  frame.appendChild(previewTag);
  const tools = document.createElement('div');
  tools.className = 'preview-tools';
  TABS.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'preview-tool';
    btn.dataset.key = t.key;
    btn.textContent = t.short;
    btn.addEventListener('click', () => setTab(t.key));
    tools.appendChild(btn);
  });
  frame.appendChild(tools);
  scroller.appendChild(preview);

  // ---- 工作台纸张 sheet ----
  const panel = document.createElement('div');
  panel.className = 'arch-panel page-pad rise rise-2';
  const bench = document.createElement('div');
  bench.className = 'card bench';
  bench.appendChild(Object.assign(document.createElement('div'), { className: 'grabber' }));

  const tabsRow = document.createElement('div');
  tabsRow.className = 'bench-tabs';
  TABS.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'bench-tab';
    btn.dataset.key = t.key;
    btn.textContent = t.name;
    const bar = document.createElement('span');
    bar.className = 'bench-tab-bar';
    btn.appendChild(bar);
    btn.addEventListener('click', () => setTab(t.key));
    tabsRow.appendChild(btn);
  });
  bench.appendChild(tabsRow);

  // 家具网格
  const furniturePanel = document.createElement('div');
  furniturePanel.className = 'bench-panel';
  const grid = document.createElement('div');
  grid.className = 'furn-grid';
  const cellEls = new Map();
  FURNITURE.forEach((f) => {
    const cell = document.createElement('button');
    cell.className = 'furn-cell';
    const icon = document.createElement('img');
    icon.className = 'furn-cell-icon';
    icon.src = assetUrl(f.thumb); // 根绝对路径必须经 assetUrl（部署子路径安全），否则 Pages 上 404
    icon.alt = f.name;
    const name = document.createElement('span');
    name.className = 'furn-cell-name';
    name.textContent = f.name;
    const check = document.createElement('span');
    check.className = 'furn-cell-check';
    check.textContent = '✓';
    cell.append(icon, name, check);
    cell.addEventListener('click', () => toggleFurniture(f.key));
    cellEls.set(f.key, cell);
    grid.appendChild(cell);
  });
  furniturePanel.appendChild(grid);
  bench.appendChild(furniturePanel);

  // 地板色板
  const floorPanel = document.createElement('div');
  floorPanel.className = 'bench-panel';
  const swatches = document.createElement('div');
  swatches.className = 'floor-swatches';
  const swatchEls = new Map();
  FLOORS.forEach((f) => {
    const wrap = document.createElement('button');
    wrap.className = 'swatch-wrap';
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = f.color;
    const check = document.createElement('span');
    check.className = 'swatch-check';
    check.textContent = '✓';
    sw.appendChild(check);
    const name = document.createElement('span');
    name.className = 'swatch-name';
    wrap.append(sw, name);
    wrap.addEventListener('click', () => selectFloor(f.key));
    swatchEls.set(f.key, { wrap, sw, name });
    swatches.appendChild(wrap);
  });
  floorPanel.appendChild(swatches);
  bench.appendChild(floorPanel);

  // 灯光滑杆
  const lightPanel = document.createElement('div');
  lightPanel.className = 'bench-panel';
  lightPanel.innerHTML = `
    <div class="light-head">
      <div class="light-value-wrap"><span class="light-value" data-role="temp"></span><span class="light-unit">K</span></div>
      <span class="paper-sub">色温 · 暖黄到雪白</span>
    </div>
    <div class="light-track-wrap">
      <div class="light-track"></div>
      <input class="light-slider" data-role="temp" type="range" min="2700" max="6000" step="100" aria-label="色温" />
    </div>
    <div class="light-ends"><span class="light-end">暖黄 2700K</span><span class="light-end">雪白 6000K</span></div>
    <div class="light-head bright-head">
      <div class="light-value-wrap"><span class="light-value bright-value" data-role="bright"></span><span class="light-unit">%</span></div>
      <span class="paper-sub">亮度 · 烛光到全亮</span>
    </div>
    <div class="light-track-wrap">
      <div class="light-track bright-track"></div>
      <input class="light-slider" data-role="bright" type="range" min="0" max="100" step="5" aria-label="亮度" />
    </div>
    <div class="light-ends"><span class="light-end">烛光 0</span><span class="light-end">全亮 100</span></div>`;
  bench.appendChild(lightPanel);
  const tempValue = lightPanel.querySelector('[data-role="temp"].light-value');
  const tempSlider = lightPanel.querySelector('input[data-role="temp"]');
  const brightValue = lightPanel.querySelector('[data-role="bright"].light-value');
  const brightSlider = lightPanel.querySelector('input[data-role="bright"]');
  // 拖动中节流：色温 <50K / 亮度 <5 不更新（对齐小程序 changing 语义）
  tempSlider.addEventListener('input', () => {
    const k = Number(tempSlider.value);
    if (Math.abs(k - draft.lightTemp) < 50) return;
    draft.lightTemp = k;
    markDirty();
    renderLight();
    renderPreview();
  });
  brightSlider.addEventListener('input', () => {
    const v = Number(brightSlider.value);
    if (Math.abs(v - draft.lightBright) < 5) return;
    draft.lightBright = v;
    markDirty();
    renderLight();
    renderPreview();
  });

  const hint = document.createElement('div');
  hint.className = 'sheet-hint';
  bench.appendChild(hint);
  panel.appendChild(bench);
  scroller.appendChild(panel);
  // web chrome：＋ tab 直达本页，挂 tabbar 保持导航连续（小程序 architect 依赖原生返回）
  const tabbar = createTabbar(page);
  container.appendChild(page);

  // ---- RoomScene 预览（live 绑定 draft） ----
  const scene = new RoomScene(frame, {
    floor: draft.floor,
    lightTemp: draft.lightTemp,
    lightBright: draft.lightBright,
    furniture: draft.furniture.slice(),
    records: recordIds,
    lampOn: true,
    projectorOn: true,
    mode: 'preview',
    characters: [{ id: 'momo', x: 54.6, y: 67, frame: 'idle', facing: 1 }],
    nowPlaying: { playing: true, title: Player.snapshot().track.title }
  });
  // 预览标签插到场景之后（z 序在上）
  frame.appendChild(previewTag);
  frame.appendChild(tools);

  // ---- 渲染 ----
  function renderSaveBtn() {
    saveBtn.className = dirty ? 'arch-save-btn btn-primary' : 'arch-save-btn pill pill-green-soft';
    saveBtn.textContent = dirty ? '保存' : '已保存';
  }

  function renderCells() {
    cellEls.forEach((cell, key) => {
      const on = draft.furniture.includes(key);
      cell.classList.toggle('furn-cell-on', on);
      cell.querySelector('.furn-cell-check').style.display = on ? '' : 'none';
    });
  }

  function renderSwatches() {
    swatchEls.forEach(({ sw, name }, key) => {
      const on = draft.floor === key;
      sw.classList.toggle('swatch-on', on);
      sw.querySelector('.swatch-check').style.display = on ? '' : 'none';
      const f = FLOORS.find((x) => x.key === key);
      name.textContent = f.name + (on ? ' · 使用中' : '');
    });
  }

  function renderLight() {
    tempValue.textContent = String(draft.lightTemp);
    tempSlider.value = String(draft.lightTemp);
    brightValue.textContent = String(draft.lightBright);
    brightSlider.value = String(draft.lightBright);
  }

  function renderHint() {
    hint.textContent = `已选家具 ${draft.furniture.length} 件 · ${draft.lightTemp}K / 亮度 ${draft.lightBright}%`;
  }

  function renderPreview() {
    scene.setProps({
      floor: draft.floor,
      lightTemp: draft.lightTemp,
      lightBright: draft.lightBright,
      furniture: draft.furniture.slice()
    });
  }

  function renderAll() {
    renderSaveBtn();
    renderCells();
    renderSwatches();
    renderLight();
    renderHint();
    renderPreview();
  }

  function markDirty() {
    if (!dirty) {
      dirty = true;
      renderSaveBtn();
    }
    renderHint();
  }

  function setTab(key) {
    activeTab = key;
    tabsRow.querySelectorAll('.bench-tab').forEach((el) => {
      el.classList.toggle('bench-tab-on', el.dataset.key === key);
    });
    tools.querySelectorAll('.preview-tool').forEach((el) => {
      el.classList.toggle('preview-tool-on', el.dataset.key === key);
    });
    furniturePanel.hidden = key !== 'furniture';
    floorPanel.hidden = key !== 'floor';
    lightPanel.hidden = key !== 'light';
  }

  function toggleFurniture(key) {
    const idx = draft.furniture.indexOf(key);
    if (idx >= 0) draft.furniture.splice(idx, 1);
    else draft.furniture.push(key);
    markDirty();
    renderCells();
    renderPreview();
  }

  function selectFloor(key) {
    draft.floor = key;
    markDirty();
    renderSwatches();
    renderPreview();
  }

  // 保存：draft → savedRoomState（roomie_room 经 store 写 localStorage，pub/sub 通知各页）
  function onSave() {
    RoomStore.saveRoom({
      floor: draft.floor,
      lightTemp: draft.lightTemp,
      lightBright: draft.lightBright,
      furniture: draft.furniture.slice()
    });
    dirty = false;
    renderSaveBtn();
    showToast({ title: '已保存房间布置', icon: 'success' });
  }

  setTab('furniture');
  renderAll();

  return {
    unmount() {
      // draft 随页面销毁（小程序无草稿持久化/退出确认，如实移植）
      scene.destroy();
      tabbar.destroy();
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
