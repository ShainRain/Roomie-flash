const app = getApp();
const RecordsUtil = require('../../utils/records');

Page({
  data: {
    user: {},
    saving: false,
    ready: false
  },

  onLoad() {
    this.setData({ user: app.globalData.user });
    // 明信片使用当前唱片墙选择，而不是固定装饰
    this.selectedRecords = RecordsUtil.readSelection((k) => wx.getStorageSync(k))
      .map((id) => RecordsUtil.byId(id))
      .filter(Boolean)
      .slice(0, 6);
    wx.getImageInfo({
      src: '/assets/img/room-postcard.jpg',
      success: (res) => {
        this.roomImage = res.path;
        this.draw();
      },
      fail: () => this.draw()
    });
  },

  draw() {
    const query = wx.createSelectorQuery().in(this);
    query
      .select('#postcard')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        this.canvasNode = canvas;
        const ctx = canvas.getContext('2d');
        const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2;
        const W = res[0].width;
        const H = res[0].height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        // 米白纸底 + 圆角卡片感由 CSS 承载,画布即卡片本身
        ctx.fillStyle = '#F6EFDD';
        ctx.fillRect(0, 0, W, H);

        // 房间插画
        const pad = 16;
        const imgH = W * 0.72;
        const finish = () => {
          this.drawText(ctx, W, H, pad, imgH);
          this.setData({ ready: true });
        };
        if (this.roomImage) {
          const img = canvas.createImage();
          img.onload = () => {
            ctx.save();
            this.roundRect(ctx, pad, pad, W - pad * 2, imgH, 12);
            ctx.clip();
            ctx.drawImage(img, pad, pad, W - pad * 2, imgH);
            ctx.restore();
            finish();
          };
          img.onerror = () => {
            ctx.fillStyle = '#223C5C';
            ctx.fillRect(pad, pad, W - pad * 2, imgH);
            finish();
          };
          img.src = this.roomImage;
        } else {
          ctx.fillStyle = '#223C5C';
          ctx.fillRect(pad, pad, W - pad * 2, imgH);
          finish();
        }
      });
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  drawText(ctx, W, H, pad, imgH) {
    // 当前唱片墙：最多 6 张选中唱片的封面色块 + 黑胶圆心
    const records = this.selectedRecords || [];
    if (records.length) {
      const size = 30;
      const gap = 10;
      const total = records.length * size + (records.length - 1) * gap;
      const x0 = (W - total) / 2;
      const y0 = imgH + pad + 14;
      records.forEach((rec, i) => {
        const x = x0 + i * (size + gap);
        ctx.save();
        this.roundRect(ctx, x, y0, size, size, 6);
        ctx.fillStyle = rec.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size / 2, y0 + size / 2, size * 0.26, 0, Math.PI * 2);
        ctx.fillStyle = '#10161F';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size / 2, y0 + size / 2, size * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = '#F6EFDD';
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.fillStyle = '#26221A';
    ctx.textAlign = 'center';
    ctx.font = '600 15px sans-serif';
    ctx.fillText('有音乐的房间，抵千万句寒暄。', W / 2, imgH + pad + 76);

    ctx.strokeStyle = '#D8CBB0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 18, imgH + pad + 96);
    ctx.lineTo(W / 2 + 18, imgH + pad + 96);
    ctx.stroke();

    ctx.fillStyle = '#9A9080';
    ctx.font = '10px sans-serif';
    ctx.fillText(`一间安静的放映室 · Roomie · ROOM ID ${this.data.user.roomId}`, W / 2, H - 18);
  },

  onSave() {
    if (this.data.saving || !this.canvasNode) return;
    if (!this.data.ready) {
      wx.showToast({ title: '海报生成中，请稍候', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    wx.canvasToTempFilePath({
      canvas: this.canvasNode,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许保存图片到相册',
              confirmText: '去设置',
              confirmColor: '#2FBF71',
              success: (r) => {
                if (r.confirm) wx.openSetting();
              }
            });
          },
          complete: () => this.setData({ saving: false })
        });
      },
      fail: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    }, this);
  },

  onShareAppMessage() {
    return {
      title: `${this.data.user.name} 的放映室：有音乐的房间，抵千万句寒暄`,
      path: '/pages/home/home'
    };
  },

  onShare() {
    wx.showToast({ title: '点右上角「···」转发给好友', icon: 'none' });
  }
});
