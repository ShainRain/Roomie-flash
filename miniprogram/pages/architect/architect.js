const app = getApp();
const Layout = require('../../utils/room-layout');
const RecordsUtil = require('../../utils/records');

const FLOORS = [
  { key: 'blue-gray', name: '夜蓝灰', color: '#3B4A6B' },
  { key: 'walnut', name: '胡桃木', color: '#8A5A33' },
  { key: 'slate', name: '深石板', color: '#4A5A66' }
];

// 家具库与房间场景同源（utils/room-layout.js，由 tools/gen-room-scene.js 生成）
const FURNITURE = Layout.FURNITURE.map((f) => ({ key: f.key, name: f.name, icon: f.icon }));

Page({
  data: {
    floors: FLOORS,
    furniture: FURNITURE,
    selectedFloor: 'blue-gray',
    floorColor: '#3B4A6B',
    selectedFurniture: [],
    previewLayers: [],
    previewSlots: [],
    lightTemp: 2700,
    lightOverlay: '',
    dirty: false,
    activeTab: 'furniture',
    tabs: [{ key: 'furniture', name: '家具', short: '具' }, { key: 'floor', name: '地板', short: '板' }, { key: 'light', name: '灯光', short: '光' }]
  },

  // 工作台分段标签切换（纯 UI 状态，不触碰房间数据）
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
  },

  onLoad() {
    const room = app.globalData.room;
    const floor = FLOORS.find((f) => f.key === room.floor) || FLOORS[0];
    this.setData({
      selectedFloor: floor.key,
      floorColor: floor.color,
      selectedFurniture: room.furniture.slice(),
      lightTemp: room.lightTemp,
      lightOverlay: this.tint(room.lightTemp)
    });
    this.rebuildPreview();
    const selected = RecordsUtil.readSelection((k) => wx.getStorageSync(k));
    this.setData({
      previewSlots: Layout.RECORD_SLOTS.slice(0, selected.length)
        .map((slot, i) => ({ ...slot, key: `slot-${i}`, src: `/assets/img/rec-${selected[i]}.webp` }))
    });
  },

  // 预览与房间页同一组家具状态：选中即显示对应覆盖层
  rebuildPreview() {
    const keys = this.data.selectedFurniture;
    this.setData({
      previewLayers: Layout.FURNITURE
        .filter((f) => keys.includes(f.key))
        .map((f) => ({ key: f.key, src: f.overlay, z: f.z }))
    });
  },

  tint(k) {
    const t = (k - 2700) / 3300;
    const warmA = (0.22 * (1 - t)).toFixed(3);
    const coolA = (0.18 * t).toFixed(3);
    return `background: linear-gradient(180deg, rgba(255,217,160,${warmA}) 0%, rgba(190,220,255,${coolA}) 100%);`;
  },

  onSelectFloor(e) {
    const key = e.currentTarget.dataset.key;
    const floor = FLOORS.find((f) => f.key === key);
    this.setData({ selectedFloor: key, floorColor: floor.color, dirty: true });
  },

  onToggleFurniture(e) {
    const key = e.currentTarget.dataset.key;
    const list = this.data.selectedFurniture.slice();
    const idx = list.indexOf(key);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(key);
    this.setData({ selectedFurniture: list, dirty: true });
    this.rebuildPreview();
  },

  onLightChange(e) {
    this.applyLight(e.detail.value);
  },

  // 拖动中节流：色温变化 <50K 不触发 setData（渐变字符串拼接有成本）
  onLightChanging(e) {
    const k = e.detail.value;
    if (Math.abs(k - this.data.lightTemp) < 50) return;
    this.applyLight(k);
  },

  applyLight(k) {
    this.setData({ lightTemp: k, lightOverlay: this.tint(k), dirty: true });
  },

  onSave() {
    app.saveRoom({
      floor: this.data.selectedFloor,
      lightTemp: this.data.lightTemp,
      furniture: this.data.selectedFurniture
    });
    this.setData({ dirty: false });
    wx.showToast({ title: '已保存房间布置', icon: 'success' });
  }
});
