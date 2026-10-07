const app = getApp();
const Player = require('../../utils/player');
const RecordsUtil = require('../../utils/records');

Page({
  data: {
    user: {},
    // Room Master Scene 输入(room-scene 组件属性,与 room 页同一母版)
    floor: 'blue-gray',
    lightTemp: 2700,
    lightBright: 100,
    furnitureKeys: [],
    recordIds: [],
    characters: [
      { id: 'momo', x: 54.6, y: 67, frame: 'idle', facing: 1 },
      { id: 'kiki', x: 25.6, y: 59.2, frame: 'idle', facing: 1 }
    ],
    nowPlaying: { playing: false, title: '' },
    friends: [
      { name: 'KIKI', color: '#F5B83D', status: '正在听《晴天》' },
      { name: 'NANA', color: '#7FB5E8', status: '正在逛唱片墙' },
      { name: 'ABO', color: '#E8734A', status: '在房间里发呆' }
    ]
  },

  unsubscribe: null,

  onLoad() {
    this.setData({ user: app.globalData.user });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refreshScene();
    this.subscribePlayer();
  },

  onHide() {
    this.unsubscribePlayer();
  },

  onUnload() {
    this.unsubscribePlayer();
  },

  // DIY/存储 → 场景:与 room 页同一份 roomie_room / roomie_records
  refreshScene() {
    const room = app.globalData.room || {};
    const snap = Player.snapshot();
    this.setData({
      furnitureKeys: (Array.isArray(room.furniture) ? room.furniture : []).slice(),
      floor: room.floor || 'blue-gray',
      lightTemp: room.lightTemp || 2700,
      lightBright: typeof room.lightBright === 'number' ? room.lightBright : 100,
      recordIds: RecordsUtil.readSelection((k) => wx.getStorageSync(k)).slice(),
      nowPlaying: { playing: snap.playing, title: snap.track.title }
    });
  },

  subscribePlayer() {
    if (this.unsubscribe) return;
    this.unsubscribe = Player.subscribe((snap) => {
      this.setData({ nowPlaying: { playing: snap.playing, title: snap.track.title } });
    });
  },

  unsubscribePlayer() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
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
