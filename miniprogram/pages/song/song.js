const Player = require('../../utils/player');

Page({
  data: {
    snap: Player.snapshot(),
    tab: 'lyric',
    lyricAnchor: '',
    statusBarH: 20,
    dragging: false,
    dragValue: 0,
    comments: [
      { user: 'KIKI', text: '前奏一响就回到高中教室了', likes: 1204 },
      { user: 'ABO', text: '在 Roomie 放映室里听这首，氛围感拉满', likes: 986 },
      { user: 'RITA', text: '深夜循环第 27 遍', likes: 453 }
    ]
  },

  unsubscribe: null,
  lastLyricIndex: -1,

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarH: info.statusBarHeight || 20 });
  },

  onShow() {
    this.subscribePlayer();
  },

  onHide() {
    this.unsubscribePlayer();
  },

  onUnload() {
    this.unsubscribePlayer();
  },

  subscribePlayer() {
    if (this.unsubscribe) return;
    this.lastLyricIndex = -1;
    this.unsubscribe = Player.subscribe((snap) => {
      const patch = { snap };
      // 歌词锚点仅在行变化时更新，避免每秒重写
      if (snap.lyricIndex !== this.lastLyricIndex) {
        this.lastLyricIndex = snap.lyricIndex;
        patch.lyricAnchor = `lyric-${snap.lyricIndex}`;
      }
      this.setData(patch);
    });
  },

  unsubscribePlayer() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onShare() {
    wx.showToast({ title: '明信片分享见「创建」页', icon: 'none' });
  },

  onSwitchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  // 拖动中：暂停进度回写，实时预览
  onSeekChanging(e) {
    this.setData({ dragging: true, dragValue: e.detail.value });
  },

  // 松手：提交 seek
  onSeek(e) {
    Player.seek(e.detail.value);
    this.setData({ dragging: false });
  },

  onTogglePlay() {
    Player.toggle();
  },

  onPrev() {
    Player.prev();
  },

  onNext() {
    Player.next();
  },

  onLike() {
    wx.showToast({ title: '已赞', icon: 'none' });
  },

  onAction(e) {
    wx.showToast({ title: `${e.currentTarget.dataset.name} · 演示功能`, icon: 'none' });
  }
});
