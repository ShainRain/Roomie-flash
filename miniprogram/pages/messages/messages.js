Page({
  data: {
    messages: [
      {
        id: 1,
        type: 'invite',
        from: 'KIKI',
        color: '#F5B83D',
        title: '邀请你一起听《晴天》',
        time: '刚刚',
        unread: true,
        action: '接受'
      },
      {
        id: 2,
        type: 'system',
        from: 'NANA',
        color: '#7FB5E8',
        title: '接受了你的邀请，已进入你的放映室',
        time: '12 分钟前',
        unread: true,
        action: '进入房间'
      },
      {
        id: 3,
        type: 'system',
        from: 'ABO',
        color: '#E8734A',
        title: '在你的唱片墙前停留了 5 分钟',
        time: '1 小时前',
        unread: false
      },
      {
        id: 4,
        type: 'system',
        from: 'RITA',
        color: '#C9CDD4',
        title: '收藏了你分享的《花海》',
        time: '昨天',
        unread: false
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.syncUnread();
  },

  syncUnread() {
    const count = this.data.messages.filter((m) => m.unread).length;
    wx.setStorageSync('roomie_unread', count);
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ badge: count });
    }
  },

  onMessageAction(e) {
    const { from } = e.currentTarget.dataset;
    this.markRead(e.currentTarget.dataset.id);
    wx.navigateTo({ url: `/pages/duo/duo?peer=${from}` });
  },

  onMessageTap(e) {
    this.markRead(e.currentTarget.dataset.id);
  },

  markRead(id) {
    const messages = this.data.messages.map((m) =>
      m.id === id ? { ...m, unread: false } : m
    );
    this.setData({ messages });
    this.syncUnread();
  }
});
