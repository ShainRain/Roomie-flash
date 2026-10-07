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
const RoomHit = require('../../utils/room-hit');

// 景深/地板多边形只需要几何（碰撞与寻路在页面侧）
const sceneMap = RoomMap.createMap(SceneLayout.GEOMETRY);

// 互动命中清单(降序 z 命中检测用):hitArea 与 collision 完全分离
const HIT_ITEMS = SceneLayout.FIXTURE_OBJECTS
  .map((o) => ({ id: o.id, z: o.z || 0, hitArea: o.hitArea }))
  .concat(SceneLayout.FURNITURE
    .filter((f) => f.hitArea)
    .map((f) => ({ id: f.hotspot.id, z: f.z, hitArea: f.hitArea })));

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
    // 亮度维度 0–100（迁移自旧版 lightBright；100=全亮，映射为 0.45–1.0 场景亮度）
    lightBright: { type: Number, value: 100 },
    // [{ id:'momo', x, y, frame:'idle|walk-a|walk-b|sit', facing: 1|-1, label }]
    characters: { type: Array, value: [] },
    mode: { type: String, value: 'interactive' }, // interactive | duo | preview
    nowPlaying: { type: Object, value: null },    // { playing, title }
    bubbles: { type: Array, value: [] },          // [{ id, x, y, text, kind }]
    nearId: { type: String, value: '' },
    activeIds: { type: Array, value: [] },
    hint: { type: Boolean, value: false },
    // 开发调试:红=hitArea(可点),蓝=collision(不可走);提交版本保持 false
    debug: { type: Boolean, value: false }
  },

  data: {
    L: SceneLayout.LAYERS,
    platter: SceneLayout.PLATTER,
    wallBadge: SceneLayout.WALL_NOW_PLAYING,
    slots: [],
    zStack: [],
    hotspots: [],
    floorStyle: '',
    op: layerOpacity(2700, true, false),
    dimOpacity: 0,
    debugHits: [],
    debugCols: []
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
    lightBright(b) {
      const v = Math.max(0, Math.min(100, typeof b === 'number' ? b : 100));
      this.setData({ dimOpacity: (0.55 * (1 - v / 100)).toFixed(3) });
    },
    records(records) {
      const picks = Array.isArray(records) ? records : [];
      const slots = SceneLayout.RECORD_SLOTS.slice(0, picks.length)
        .map((slot, i) => ({ ...slot, key: `slot-${i}`, src: `/assets/img/room/rec-plate-${picks[i]}.webp` }));
      this.setData({ slots });
    },
    'furniture, characters': function () { this.rebuildStack(); },
    'furniture, nearId, activeIds, hint': function () { this.rebuildHotspots(); },
    'debug, furniture': function () { this.rebuildDebug(); }
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
      // 热点视图纯视觉化(不再吞点击);几何 = hitArea
      const list = SceneLayout.FIXTURE_OBJECTS
        .map((o) => ({ id: o.id, icon: o.icon, name: o.name, z: o.z, ...o.hitArea }))
        .concat(SceneLayout.FURNITURE
          .filter((f) => f.hotspot && (f.fixed || selected.includes(f.id)))
          .map((f) => ({ id: f.hotspot.id, icon: f.hotspot.icon, name: f.hotspot.name, z: f.z, ...f.hitArea })))
        .map((o) => ({
          ...o,
          lit: this.data.activeIds.includes(o.id) || o.id === this.data.nearId
        }));
      this.setData({ hotspots: list });
    },

    rebuildDebug() {
      if (!this.data.debug) {
        if (this.data.debugHits.length || this.data.debugCols.length) this.setData({ debugHits: [], debugCols: [] });
        return;
      }
      const selected = Array.isArray(this.data.furniture) ? this.data.furniture : [];
      const debugHits = SceneLayout.FIXTURE_OBJECTS
        .concat(SceneLayout.FURNITURE.filter((f) => f.hotspot && (f.fixed || selected.includes(f.id))))
        .filter((o) => o.hitArea)
        .map((o) => ({ id: o.hotspot ? o.hotspot.id : o.id, ...o.hitArea }));
      // collision(uv 矩形)→ 舞台百分比平行四边形(与 room-map 同一几何)
      const cols = SceneLayout.FURNITURE
        .filter((f) => f.collision && (f.fixed || selected.includes(f.id)))
        .map((f) => ({ id: f.id, collision: f.collision }))
        .concat((SceneLayout.FIXED_COLLIDERS || []).map((c) => ({ id: c.id, collision: c.collision })));
      const debugCols = cols.map((c) => {
        const pts = [
          sceneMap.fromUV(c.collision.u0, c.collision.v0),
          sceneMap.fromUV(c.collision.u1, c.collision.v0),
          sceneMap.fromUV(c.collision.u1, c.collision.v1),
          sceneMap.fromUV(c.collision.u0, c.collision.v1)
        ].map((p) => `${p.left.toFixed(1)}% ${p.top.toFixed(1)}%`).join(', ');
        return { id: c.id, poly: `polygon(${pts})` };
      });
      this.setData({ debugHits, debugCols });
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
        const left = ((x - rect.left) / rect.width) * 100;
        const top = ((y - rect.top) / rect.height) * 100;
        // 命中管道:先查家具 hitArea(高 z 优先),命中才 furnituretap;否则交还给 floor 寻路
        if (this.data.mode !== 'preview') {
          const selected = Array.isArray(this.data.furniture) ? this.data.furniture : [];
          const items = HIT_ITEMS.filter((it) => {
            const f = SceneLayout.FURNITURE.find((ff) => ff.hotspot && ff.hotspot.id === it.id);
            return !f || f.fixed || selected.includes(f.id);
          });
          const hit = RoomHit.hitTest(left, top, items);
          if (hit) {
            this.triggerEvent('furnituretap', { id: hit.id });
            return;
          }
        }
        // 事件名用 stagetap 而非 tap:避免与原生 tap 冒泡撞名导致页面处理两次
        this.triggerEvent('stagetap', { left, top });
      }).exec();
    },

    onHotspotTap(e) {
      // 真机取 currentTarget;自动化合成事件可能只有 target
      const ds = (e.currentTarget || e.target || {}).dataset || {};
      if (!ds.id) return;
      this.triggerEvent('furnituretap', { id: ds.id });
    },

    onCharTap(e) {
      const ds = (e.currentTarget || e.target || {}).dataset || {};
      if (!ds.id) return;
      this.triggerEvent('chartap', { id: ds.id });
    }
  }
});
