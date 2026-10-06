/**
 * room-scene — Room Master Scene 纯渲染组件（Phase 0 §7 接口）
 *
 * 职责：L0–L7 灯光图层栈、地板 tint、唱片槽位、家具覆盖层、角色（景深/朝向/脚底阴影）、
 *       热点命中上报、触点归一化上报。
 * 不做：寻路/碰撞（页面调 room-map）、同步、播放器、存储。
 *
 * 数据源：utils/room-scene-layout.js（tools/gen-room-master.js 生成，单一数据源）。
 */
const RoomMap = require('../../utils/room-map');
const SceneLayout = require('../../utils/room-scene-layout');

// 景深/地板多边形只需要几何（碰撞与寻路在页面侧）
const sceneMap = RoomMap.createMap(SceneLayout.GEOMETRY);

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// 灯光层不透明度规则（与 tools/render-room-master.js 的离线合成镜像一致）
function layerOpacity(lightTemp, lampOn, projectorOn) {
  const t = Math.max(0, Math.min(1, ((lightTemp || 2700) - 2700) / 3300));
  const lampFactor = lampOn ? 1 : 0.25;
  return {
    L2: 0.5 + 0.5 * t,
    L3: Math.max(0, 1 - t) * lampFactor,
    L4: 0.85,
    L5: lampOn ? 1 : 0,
    L6: Math.max(0.08, (1 - t) * (0.35 + 0.65 * lampFactor)),
    L7: projectorOn ? 1 : 0
  };
}

Component({
  properties: {
    floor: { type: String, value: 'blue-gray' },
    lightTemp: { type: Number, value: 2700 },
    furniture: { type: Array, value: [] },
    records: { type: Array, value: [] },
    lampOn: { type: Boolean, value: true },
    projectorOn: { type: Boolean, value: false },
    // [{ id:'momo', x, y, frame:'idle|walk-a|walk-b|sit', facing: 1|-1, label }]
    characters: { type: Array, value: [] },
    mode: { type: String, value: 'interactive' }, // interactive | duo | preview
    nowPlaying: { type: Object, value: null },    // { playing, title }
    bubbles: { type: Array, value: [] },          // [{ id, x, y, text, kind }]
    nearId: { type: String, value: '' },
    activeIds: { type: Array, value: [] },
    hint: { type: Boolean, value: false }
  },

  data: {
    L: SceneLayout.LAYERS,
    platter: SceneLayout.PLATTER,
    wallBadge: SceneLayout.WALL_NOW_PLAYING,
    slots: [],
    zStack: [],
    hotspots: [],
    floorStyle: '',
    op: layerOpacity(2700, true, false)
  },

  observers: {
    floor(floor) {
      const hex = FLOOR_COLORS[floor] || FLOOR_COLORS['blue-gray'];
      const pts = sceneMap.floorPolygon()
        .map((p) => `${p.left.toFixed(2)}% ${p.top.toFixed(2)}%`).join(', ');
      this.setData({ floorStyle: `clip-path: polygon(${pts}); background: ${hexToRgba(hex, 0.45)};` });
    },
    'lightTemp, lampOn, projectorOn': function (lightTemp, lampOn, projectorOn) {
      this.setData({ op: layerOpacity(lightTemp, lampOn, projectorOn) });
    },
    records(records) {
      const picks = Array.isArray(records) ? records : [];
      const slots = SceneLayout.RECORD_SLOTS.slice(0, picks.length)
        .map((slot, i) => ({ ...slot, key: `slot-${i}`, src: `/assets/img/room/rec-plate-${picks[i]}.webp` }));
      this.setData({ slots });
    },
    'furniture, characters': function () { this.rebuildStack(); },
    'furniture, nearId, activeIds, hint': function () { this.rebuildHotspots(); }
  },

  methods: {
    // 家具（按 z）与角色（z = top%×10，同轴遮挡）合并排序
    rebuildStack() {
      const selected = Array.isArray(this.data.furniture) ? this.data.furniture : [];
      const furns = SceneLayout.FURNITURE
        .filter((f) => f.fixed || selected.includes(f.id))
        .map((f) => ({ type: 'furn', key: `f-${f.id}`, src: f.asset, z: f.z }));
      const chars = (this.data.characters || []).map((c) => {
        const depth = sceneMap.depthFor(c.y);
        const hPct = (SceneLayout.CHAR.baseHeight * depth.scale) / 8.28;
        const wPct = hPct / SceneLayout.CHAR.spriteAspect;
        return {
          type: 'char', key: `c-${c.id}`, ...c,
          z: depth.z, scale: depth.scale,
          wPct: wPct.toFixed(2), shadowW: (wPct * 0.62).toFixed(2)
        };
      });
      this.setData({ zStack: furns.concat(chars).sort((a, b) => a.z - b.z) });
    },

    rebuildHotspots() {
      if (this.data.mode === 'preview') {
        if (this.data.hotspots.length) this.setData({ hotspots: [] });
        return;
      }
      const selected = Array.isArray(this.data.furniture) ? this.data.furniture : [];
      const list = SceneLayout.FIXTURE_OBJECTS
        .concat(SceneLayout.FURNITURE
          .filter((f) => f.hotspot && (f.fixed || selected.includes(f.id)))
          .map((f) => f.hotspot))
        .map((o) => ({
          ...o,
          lit: this.data.activeIds.includes(o.id) || o.id === this.data.nearId
        }));
      this.setData({ hotspots: list });
    },

    onStageTap(e) {
      // 触点坐标:优先 e.detail(真机 tap),退化到 changedTouches(部分自动化环境)
      const d = e.detail || {};
      let x = d.x;
      let y = d.y;
      if ((x == null || y == null) && e.changedTouches && e.changedTouches[0]) {
        x = e.changedTouches[0].x;
        y = e.changedTouches[0].y;
      }
      if (x == null || y == null) return;
      const query = this.createSelectorQuery();
      query.select('.sc-stage').boundingClientRect((rect) => {
        if (!rect) return;
        // 事件名用 stagetap 而非 tap:避免与原生 tap 冒泡撞名导致页面处理两次
        this.triggerEvent('stagetap', {
          left: ((x - rect.left) / rect.width) * 100,
          top: ((y - rect.top) / rect.height) * 100
        });
      }).exec();
    },

    onHotspotTap(e) {
      this.triggerEvent('furnituretap', { id: e.currentTarget.dataset.id });
    },

    onCharTap(e) {
      this.triggerEvent('chartap', { id: e.currentTarget.dataset.id });
    }
  }
});
