const app = getApp();

Page({
  data: {
    user: {},
    friends: [
      { name: 'KIKI', color: '#F5B83D', status: '正在听《晴天》' },
      { name: 'NANA', color: '#7FB5E8', status: '正在逛唱片墙' },
      { name: 'ABO', color: '#E8734A', status: '在房间里发呆' }
    ]
  },

  onLoad() {
    this.setData({ user: app.globalData.user });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      success: () => wx.showToast({ title: '点右上角「···」分享房间', icon: 'none' })
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.user.name} 的深夜放映室正在放映，来一起听`,
      path: '/pages/home/home',
      imageUrl: '/assets/img/room-postcard.jpg'
    };
  },

  onEnterRoom() {
    wx.navigateTo({ url: '/pages/room/room' });
  },

  onListenTogether() {
    wx.showToast({ title: '已向 KIKI 发出一起听邀请', icon: 'none' });
  }
});
