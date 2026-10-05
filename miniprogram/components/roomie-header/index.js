Component({
  options: { addGlobalClass: true },
  properties: {
    // 副标题,如「深夜放映室 · 0731」
    subtitle: { type: String, value: '深夜放映室 · 0731' },
    live: { type: Boolean, value: true },
    liveText: { type: String, value: 'LIVE' },
    avatar: { type: String, value: 'M' },
    avatarColor: { type: String, value: '#F0A93C' },
    // navigationStyle: custom 的页面置 true,自动让出状态栏
    customNav: { type: Boolean, value: false },
    // 是否显示分享按钮(保留各页既有分享能力)
    share: { type: Boolean, value: false },
    // 页面主标题(中文)与英文小标,渲染为编辑式刊头;不传则不渲染
    pageTitle: { type: String, value: '' },
    pageSubtitle: { type: String, value: '' }
  },

  data: { statusBarHeight: 20 },

  attached() {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      if (info && info.statusBarHeight) this.setData({ statusBarHeight: info.statusBarHeight });
    } catch (err) { /* 保留默认值 */ }
  },

  methods: {
    onShare() { this.triggerEvent('share'); }
  }
});
