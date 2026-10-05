const Player = require('../../utils/player');

Component({
  options: { addGlobalClass: true },

  properties: {
    // 副标题覆盖（默认显示「歌手 · 专辑」）
    subtitle: { type: String, value: '' },
    // 点击封面/信息区的跳转目标：'song' 进歌曲页，'none' 不跳转
    tapTarget: { type: String, value: 'song' }
  },

  data: {
    snap: Player.snapshot()
  },

  pageLifetimes: {
    show() {
      this.subscribePlayer();
    },
    hide() {
      this.unsubscribePlayer();
    }
  },

  lifetimes: {
    detached() {
      this.unsubscribePlayer();
    }
  },

  methods: {
    subscribePlayer() {
      if (!this._unsub) {
        this._unsub = Player.subscribe((snap) => this.setData({ snap }));
      }
    },

    unsubscribePlayer() {
      if (this._unsub) {
        this._unsub();
        this._unsub = null;
      }
    },

    emitControl(action) {
      this.triggerEvent('control', { action });
    },

    onTogglePlay() {
      Player.toggle();
      this.emitControl('toggle');
    },

    onPrev() {
      Player.prev();
      this.emitControl('prev');
    },

    onNext() {
      Player.next();
      this.emitControl('next');
    },

    onOpenDetail() {
      if (this.data.tapTarget === 'song') {
        wx.navigateTo({ url: '/pages/song/song' });
      }
    }
  }
});
