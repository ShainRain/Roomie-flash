const app = getApp();
const SceneLayout = require('../../utils/room-scene-layout');
const RecordsUtil = require('../../utils/records');

const FLOORS = [
  { key: 'blue-gray', name: '夜蓝灰', color: '#3B4A6B' },
  { key: 'walnut', name: '胡桃木', color: '#8A5A33' },
  { key: 'slate', name: '深石板', color: '#4A5A66' }
];

// 家具库与 Room Master 单一数据源同源(room-scene-layout.js,gen-room-master.js 生成)
// 缩略图为房间资产同源裁切(furn-thumb-*),不再是双色 icon
const FURNITURE = SceneLayout.FURNITURE
  .filter((f) => !f.fixed)
  .map((f) => ({ key: f.id, name: f.label, thumb: f.thumb }));

Page({
  data: {
    floors: FLOORS,
    furniture: FURNITURE,
    selectedFloor: 'blue-gray',
    selectedFurniture: [],
    lightTemp: 2700,
    dirty: false,
    activeTab: 'furniture',
    tabs: [{ key: 'furniture', name: '家具', short: '具' }, { key: 'floor', name: '地板', short: '板' }, { key: 'light', name: '灯光', short: '光' }],
    // Room Master 预览输入(room-scene 组件属性;预览即最终房间)
    recordIds: [],
    characters: [{ id: 'momo', x: 54.6, y: 67, frame: 'idle', facing: 1 }],
    nowPlaying: { playing: true, title: '晴天' },
    cells: [] // FURNITURE + on 标记(WXML 表达式不做数组查找,选中态在 JS 计算)
  },

  // 工作台分段标签切换（纯 UI 状态，不触碰房间数据）
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
  },

  onLoad() {
    const room = app.globalData.room;
    this.setData({
      selectedFloor: room.floor,
      selectedFurniture: room.furniture.slice(),
      lightTemp: room.lightTemp,
      recordIds: RecordsUtil.readSelection((k) => wx.getStorageSync(k)).slice()
    });
    this.rebuildCells();
  },

  rebuildCells() {
    const sel = this.data.selectedFurniture;
    this.setData({ cells: FURNITURE.map((f) => ({ ...f, on: sel.includes(f.key) })) });
  },

  onSelectFloor(e) {
    this.setData({ selectedFloor: e.currentTarget.dataset.key, dirty: true });
  },

  onToggleFurniture(e) {
    const key = e.currentTarget.dataset.key;
    const list = this.data.selectedFurniture.slice();
    const idx = list.indexOf(key);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(key);
    this.setData({ selectedFurniture: list, dirty: true });
    this.rebuildCells();
  },

  onLightChange(e) {
    this.setData({ lightTemp: e.detail.value, dirty: true });
  },

  // 拖动中节流：色温变化 <50K 不触发 setData
  onLightChanging(e) {
    const k = e.detail.value;
    if (Math.abs(k - this.data.lightTemp) < 50) return;
    this.setData({ lightTemp: k, dirty: true });
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
