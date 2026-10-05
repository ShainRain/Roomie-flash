Component({
  data: {
    selected: 0,
    badge: 0,
    list: [
      { pagePath: '/pages/home/home', text: '房间', glyph: 'home' },
      { pagePath: '/pages/friends/friends', text: '好友', glyph: 'friends' },
      { pagePath: '/pages/create/create', text: '', glyph: 'create' },
      { pagePath: '/pages/messages/messages', text: '消息', glyph: 'msg' },
      { pagePath: '/pages/profile/profile', text: '我', glyph: 'me' }
    ]
  },

  pageLifetimes: {
    show() {
      this.setData({ badge: wx.getStorageSync('roomie_unread') || 0 });
    }
  },

  methods: {
    onTap(e) {
      const { path, index } = e.currentTarget.dataset;
      this.setData({ selected: index });
      wx.switchTab({ url: path });
    }
  }
});
