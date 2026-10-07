Page({
  data: {
    // 好友房间 vignette(Master 派生的小房间,视觉锚点;动作与列表共用同一状态)
    vignettes: [
      { name: 'KIKI', img: '/assets/img/vignette-kiki.webp', status: '在你的房间 · 一起听《晴天》', action: '进入', type: 'enter' },
      { name: 'NANA', img: '/assets/img/vignette-nana.webp', status: '正在听《晴天》', action: '来坐坐', type: 'invite' },
      { name: 'ABO', img: '/assets/img/vignette-abo.webp', status: '正在逛唱片墙', action: '来坐坐', type: 'invite' }
    ],
    online: [
      { name: 'KIKI', color: '#F5B83D', status: '在你的房间 · 一起听《晴天》', tag: '房间中', action: '进入', type: 'enter' },
      { name: 'NANA', color: '#7FB5E8', status: '正在听《晴天》', tag: '', action: '邀请', type: 'invite' },
      { name: 'ABO', color: '#E8734A', status: '正在逛唱片墙', tag: '', action: '邀请', type: 'invite' }
    ],
    offline: [
      { name: 'RITA', color: '#C9CDD4', status: '2 小时前听过《花海》', action: '邀请', type: 'invite' },
      { name: 'TAO', color: '#C9CDD4', status: '昨天布置了唱片墙', action: '邀请', type: 'invite' }
    ],
    inviting: ''
  },

  inviteTimer: null,

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onHide() {
    this.cancelInvite();
  },

  onUnload() {
    this.cancelInvite();
  },

  cancelInvite() {
    if (this.inviteTimer) {
      clearTimeout(this.inviteTimer);
      this.inviteTimer = null;
      this.setData({ inviting: '' });
    }
  },

  onFriendAction(e) {
    const { type, name } = e.currentTarget.dataset;
    if (type === 'enter') {
      wx.navigateTo({ url: `/pages/duo/duo?peer=${name}` });
      return;
    }
    if (this.data.inviting) return;
    this.setData({ inviting: name });
    wx.showToast({ title: `已邀请 ${name}，等待接受…`, icon: 'none' });
    this.inviteTimer = setTimeout(() => {
      this.inviteTimer = null;
      this.setData({ inviting: '' });
      wx.showModal({
        title: '邀请已接受',
        content: `${name} 接受了你的邀请，进入双人放映室？`,
        confirmText: '进入房间',
        confirmColor: '#2FBF71',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: `/pages/duo/duo?peer=${name}` });
          }
        }
      });
    }, 1500);
  },

  onBannerInvite() {
    wx.showToast({ title: '邀请链接已复制（演示）', icon: 'none' });
  }
});
