const app = getApp();
const { RECORDS, readSelection, MAX_PICK } = require('../../utils/records');
const Avatar = require('../../utils/avatar');

const FLOOR_NAMES = { 'blue-gray': '夜蓝灰', walnut: '胡桃木', slate: '深石板' };

Page({
  data: {
    user: {},
    records: [],
    cells: [], // RECORDS + cover + on(WXML 表达式不做数组查找,选中态在 JS 计算)
    selected: [],
    maxPick: MAX_PICK,
    dirty: false,
    roomInfo: { floorName: '夜蓝灰', lightTemp: 2700, lightBright: 100, furnitureCount: 0 },
    // 自定义形象（头像与服装双槽位,迁移自旧版 avatar 系统）
    avatarSrc: '',
    hasCustom: false,
    avatarHint: '',
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
        lightBright: typeof room.lightBright === 'number' ? room.lightBright : 100,
        furnitureCount: Array.isArray(room.furniture) ? room.furniture.length : 0
      }
    });
    this.rebuildCells();
    this.refreshAvatar();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    this.refreshAvatar();
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

  // ---- 自定义形象：头像与服装是两个独立槽位，互不影响（迁移自旧版） ----
  refreshAvatar() {
    const avatar = Avatar.read('avatar');
    const outfit = Avatar.read('outfit');
    this.setData({
      avatarSrc: avatar ? avatar.path : '',
      hasCustom: !!(avatar || outfit),
      avatarHint: `头像：${avatar ? `已导入 ${avatar.name}` : '默认'} · 服装：${outfit ? `已导入 ${outfit.name}` : '默认（房间里是 MOMO 团子）'}`
    });
  },

  // 「换头像」「换服装」都直接打开相册（系统在此刻请求相册权限），选中即导入
  onImportAvatar() {
    this.chooseFromAlbum('avatar');
  },

  onImportOutfit() {
    this.chooseFromAlbum('outfit');
  },

  chooseFromAlbum(slot) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['original'], // 压缩会丢透明通道，带透明底的 webp/png 必须选原图
      sourceType: ['album'],
      success: (res) => {
        const picked = (res.tempFiles || [])[0] || {};
        this.applyPicked(slot, picked.tempFilePath, { size: picked.size });
      },
      fail: (err) => this.handleImportFail(err)
    });
  },

  // 兜底入口：相册选择器没有扩展名过滤、还可能把 webp 转码，
  // 需要按文件类型精确挑选时走聊天记录（可先把文件发给「文件传输助手」）。
  onImportImageFile() {
    const targets = [
      { slot: 'avatar', label: '导入头像（.webp / .png）' },
      { slot: 'outfit', label: '导入服装（.webp / .png）' }
    ];
    wx.showActionSheet({
      itemList: targets.map((t) => t.label),
      success: (res) => this.chooseImageFile(targets[res.tapIndex].slot),
      fail: () => {} // 用户取消，不打扰
    });
  },

  chooseImageFile(slot) {
    const allowed = ['webp', 'png'];
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: allowed,
      success: (res) => {
        const picked = (res.tempFiles || [])[0] || {};
        const name = picked.name || picked.path || '';
        const ext = (/\.([A-Za-z0-9]+)\s*$/.exec(name) || [])[1];
        if (!ext || allowed.indexOf(ext.toLowerCase()) < 0) {
          wx.showToast({ title: '请选择 .webp 或 .png 文件', icon: 'none' });
          return;
        }
        this.applyPicked(slot, picked.path, { name: picked.name, size: picked.size });
      },
      fail: (err) => this.handleImportFail(err)
    });
  },

  applyPicked(slot, tempFilePath, file) {
    if (!tempFilePath) return;
    const check = Avatar.validate(file && file.size);
    if (!check.ok) {
      wx.showToast({ title: check.reason, icon: 'none', duration: 2600 });
      return;
    }
    try {
      Avatar.save(slot, tempFilePath, file);
      this.refreshAvatar();
      wx.showToast({
        title: slot === 'outfit' ? '服装已更新，去房间看看' : '头像已更新',
        icon: 'none',
        duration: 2000
      });
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  onResetAvatar() {
    wx.showModal({
      title: '恢复默认形象？',
      content: '头像与服装都会回到默认状态。',
      confirmText: '恢复默认',
      success: (res) => {
        if (!res.confirm) return;
        Avatar.clear('avatar');
        Avatar.clear('outfit');
        this.refreshAvatar();
        wx.showToast({ title: '已恢复默认形象', icon: 'none' });
      }
    });
  },

  // 用户取消不算失败，不打扰；真正的权限拒绝要给可恢复路径
  handleImportFail(err) {
    const msg = (err && err.errMsg) || '';
    if (/cancel/i.test(msg)) return;
    wx.showModal({
      title: '没有拿到图片',
      content: '需要相册权限才能导入形象。可先在小程序设置里开启；若仍然不行，请到手机系统的「设置 → 微信 → 照片」里允许访问。',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) wx.openSetting();
      }
    });
  },

  onGotoRoom() {
    wx.navigateTo({ url: '/pages/room/room' });
  },

  onSetting() {
    wx.showToast({ title: '设置 · 即将上线', icon: 'none' });
  }
});
