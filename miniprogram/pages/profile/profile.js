const app = getApp();
const { RECORDS, readSelection, MAX_PICK } = require('../../utils/records');

Page({
  data: {
    user: {},
    records: [],
    selected: [],
    maxPick: MAX_PICK,
    dirty: false,
    achievements: [
      { name: '新晋达人', lv: 3, color: '#F0A93C', glyph: '♪' },
      { name: '建筑师傅', lv: 4, color: '#8A5A33', glyph: '⚒' },
      { name: '愈音之友', lv: 2, color: '#3B4A6B', glyph: '✦' }
    ]
  },

  onLoad() {
    this.setData({
      user: app.globalData.user,
      records: RECORDS,
      selected: readSelection((k) => wx.getStorageSync(k))
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
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
