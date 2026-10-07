App({
  globalData: {
    user: {
      name: 'MOMO',
      level: 7,
      badge: '建筑师',
      roomId: '0731',
      roomName: '深夜放映室'
    },
    // 播放器状态由 utils/player.js 单例管理（Day 2 起）
    // 房间 DIY 状态（Day 4 持久化）；furniture 对应 utils/room-layout.js 的家具 key
    room: {
      floor: 'blue-gray',
      lightTemp: 2700,
      lightBright: 100,
      furniture: ['sofa', 'vinyl-player', 'lamp', 'plant', 'rug', 'projector', 'guitar', 'bookshelf', 'coffee']
    }
  },

  onLaunch() {
    this.globalData.room = this.normalizeRoom(wx.getStorageSync('roomie_room'));
    // 未读角标初始值（mock：2 条未读邀请/动态）
    if (!wx.getStorageSync('roomie_unread')) wx.setStorageSync('roomie_unread', 2);
  },

  // 旧版本缓存结构防御：字段缺失/类型错误一律回退默认值
  normalizeRoom(raw) {
    const def = { floor: 'blue-gray', lightTemp: 2700, lightBright: 100, furniture: ['sofa', 'vinyl-player', 'lamp', 'plant', 'rug', 'projector', 'guitar', 'bookshelf', 'coffee'] };
    if (!raw || typeof raw !== 'object') return def;
    return {
      floor: typeof raw.floor === 'string' ? raw.floor : def.floor,
      lightTemp: typeof raw.lightTemp === 'number' ? raw.lightTemp : def.lightTemp,
      lightBright: typeof raw.lightBright === 'number' ? Math.max(0, Math.min(100, raw.lightBright)) : def.lightBright,
      furniture: Array.isArray(raw.furniture) ? raw.furniture : def.furniture.slice()
    };
  },

  saveRoom(room) {
    this.globalData.room = room;
    wx.setStorageSync('roomie_room', room);
  }
});
