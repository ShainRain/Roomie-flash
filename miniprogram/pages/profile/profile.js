const app = getApp();
const { RECORDS, readSelection, MAX_PICK } = require('../../utils/records');

const FLOOR_NAMES = { 'blue-gray': '夜蓝灰', walnut: '胡桃木', slate: '深石板' };

Page({
  data: {
    user: {},
    records: [],
    cells: [], // RECORDS + cover + on(WXML 表达式不做数组查找,选中态在 JS 计算)
    selected: [],
    maxPick: MAX_PICK,
    dirty: false,
    roomInfo: { floorName: '夜蓝灰', lightTemp: 2700, furnitureCount: 0 },
    achievements: [
      { name: '新晋达人', lv: 3, color: '#F0A93C', glyph: '♪' },
      { name: '建筑师傅', lv: 4, color: '#8A5A33', glyph: '⚒' },
      { name: '愈音之友', lv: 2, color: '#3B4A6B', glyph: '✦' }
    ]
  },

  onLoad() {
    const room = app.globalData.room || {};
    this.setData({
      user: app.globalData.user,
      records: RECORDS,
      selected: readSelection((k) => wx.getStorageSync(k)),
      roomInfo: {
        floorName: FLOOR_NAMES[room.floor] || room.floor,
        lightTemp: room.lightTemp || 2700,
        furnitureCount: Array.isArray(room.furniture) ? room.furniture.length : 0
      }
    });
    this.rebuildCells();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
  },

  rebuildCells() {
    const sel = this.data.selected;
    this.setData({
      cells: RECORDS.map((r) => ({ ...r, cover: `/assets/img/cover-${r.id}.webp`, on: sel.includes(r.id) }))
    });
  },

  onToggleRecord(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.selected.slice();
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      if (list.length >= this.data.maxPick) {
        wx.showToast({ title: `最多挂 ${this.data.maxPick} 张`, icon: 'none' });
        return;
      }
      list.push(id);
    }
    this.setData({ selected: list, dirty: true });
    this.rebuildCells();
  },

  onSave() {
    wx.setStorageSync('roomie_records', this.data.selected);
    this.setData({ dirty: false });
    wx.showToast({ title: '唱片墙已保存', icon: 'success' });
  },

  onDress(e) {
    wx.showToast({ title: `${e.currentTarget.dataset.name} · 素材即将更新`, icon: 'none' });
  },

  onGotoRoom() {
    wx.navigateTo({ url: '/pages/room/room' });
  },

  onSetting() {
    wx.showToast({ title: '设置 · 即将上线', icon: 'none' });
  }
});
