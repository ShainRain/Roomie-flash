Page({
  data: {
    entries: [
      {
        key: 'architect',
        glyph: '筑',
        title: '建筑师模式',
        desc: '布置家具 · 地板材质 · 灯光色温',
        url: '/pages/architect/architect'
      },
      {
        key: 'show',
        glyph: '映',
        title: '发起放映',
        desc: '进入深夜放映室，开始今晚的放映',
        url: '/pages/room/room'
      },
      {
        key: 'postcard',
        glyph: '笺',
        title: '生成明信片',
        desc: '把房间做成海报，分享给好友',
        url: '/pages/postcard/postcard'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onEntry(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});
