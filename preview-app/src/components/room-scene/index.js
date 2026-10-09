/**
 * room-scene Web Renderer — DOM port of miniprogram/components/room-scene/
 *
 * 职责：L0–L7 灯光图层栈、地板 tint、唱片槽位、家具覆盖层、角色（景深/朝向/脚底阴影）、
 *       热点命中上报、触点归一化上报。不做：寻路/碰撞（页面调 room-map）、同步、播放器、存储。
 *
 * 数据源：shared/room-scene-layout.js（生成产物拷贝，勿手改）。
 * 坐标系：舞台正方形，828px ↔ 100%（px/8.28），一切定位用 stage %。
 *
 * 用法：
 *   const scene = new RoomScene(containerEl, { floor, lightTemp, ..., onFurnitureTap });
 *   scene.setProps({ lampOn: false });   // diff 重渲染动态层
 *   scene.destroy();
 */
import SceneLayout from '../../shared/room-scene-layout.js';
import { createMap } from '../../shared/room-map.js';
import { hitTest } from '../../shared/room-hit.js';
import { assetUrl } from '../../utils/asset-url.js';

// 景深/地板多边形只需要几何（碰撞与寻路在页面侧）
const sceneMap = createMap(SceneLayout.GEOMETRY, SceneLayout);

// 互动命中清单（降序 z 命中检测用）：hitArea 与 collision 完全分离
const HIT_ITEMS = SceneLayout.FIXTURE_OBJECTS
  .map((o) => ({ id: o.id, z: o.z || 0, hitArea: { left: o.left, top: o.top, width: o.width, height: o.height } }))
  .concat(SceneLayout.FURNITURE
    .filter((f) => f.hitArea)
    .map((f) => ({ id: f.hotspot.id, z: f.z, hitArea: f.hitArea })));

const FLOOR_COLORS = { 'blue-gray': '#3B4A6B', walnut: '#8A5A33', slate: '#4A5A66' };

// Assets live in the /assets/... URL space（public/assets，synced from miniprogram/assets）；
// 一律经共享 assetUrl 解析（部署子路径安全，生成文件不改）。
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// 预加载全部角色精灵帧（行走切帧不再触发首次请求闪烁；解码失败暴露 URL，不隐藏角色）
let spritesPreloaded = false;
function preloadCharSprites() {
  if (spritesPreloaded || typeof Image === 'undefined') return;
  spritesPreloaded = true;
  ['momo', 'kiki'].forEach((id) => {
    ['idle', 'walk-a', 'walk-b', 'sit'].forEach((frame) => {
      const url = assetUrl(`/assets/img/char-${id}-${frame}.webp`);
      const img = new Image();
      img.onerror = () => console.error('[room-scene] character sprite failed to load:', url);
      img.src = url;
    });
  });
}

// 灯光层不透明度规则（与 tools/render-room-master.js 的离线合成镜像一致）
export function layerOpacity(lightTemp, lampOn, projectorOn) {
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

const DEFAULT_PROPS = {
  floor: 'blue-gray',
  lightTemp: 2700,
  lightBright: 100,
  furniture: [],
  records: [],
  lampOn: true,
  projectorOn: false,
  characters: [],
  mode: 'interactive', // interactive | duo | preview
  nowPlaying: null,    // { playing, title }
  bubbles: [],
  nearId: '',
  activeIds: [],
  hint: false,
  debug: false
};

export class RoomScene {
  constructor(container, props = {}) {
    this.container = container;
    this.props = { ...DEFAULT_PROPS, ...props };
    this.charNodes = new Map(); // char id -> element（走动时只改 transform，不重建）
    this.build();
    this.render();
  }

  // ---- 静态 DOM 骨架（构建一次，避免图层闪烁）----
  build() {
    const L = SceneLayout.LAYERS;
    const el = document.createElement('div');
    el.className = 'sc-stage';
    el.innerHTML = `
      <img class="sc-ly" data-ly="L0" alt="" />
      <img class="sc-ly" data-ly="L1" alt="" />
      <img class="sc-ly sc-screen" data-ly="L2" alt="" />
      <div class="sc-floor-tint"></div>
      <img class="sc-ly sc-screen" data-ly="L3" alt="" />
      <img class="sc-ly sc-screen" data-ly="L4" alt="" />
      <div class="sc-slots"></div>
      <div class="sc-zstack"></div>
      <img class="sc-ly sc-screen" data-ly="L5" alt="" />
      <img class="sc-ly sc-screen" data-ly="L6" alt="" />
      <img class="sc-ly sc-screen" data-ly="L7" alt="" />
      <div class="sc-dim"></div>
      <div class="sc-turntable-spin" hidden></div>
      <div class="sc-wall-badge" hidden></div>
      <div class="sc-hotspots"></div>
      <div class="sc-debug"></div>
      <div class="sc-bubbles"></div>`;
    ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].forEach((k) => {
      el.querySelector(`[data-ly="${k}"]`).src = assetUrl(L[k]);
    });
    this.stage = el;
    this.els = {
      L2: el.querySelector('[data-ly="L2"]'),
      L3: el.querySelector('[data-ly="L3"]'),
      L4: el.querySelector('[data-ly="L4"]'),
      L5: el.querySelector('[data-ly="L5"]'),
      L6: el.querySelector('[data-ly="L6"]'),
      L7: el.querySelector('[data-ly="L7"]'),
      floorTint: el.querySelector('.sc-floor-tint'),
      slots: el.querySelector('.sc-slots'),
      zstack: el.querySelector('.sc-zstack'),
      dim: el.querySelector('.sc-dim'),
      platter: el.querySelector('.sc-turntable-spin'),
      wallBadge: el.querySelector('.sc-wall-badge'),
      hotspots: el.querySelector('.sc-hotspots'),
      debug: el.querySelector('.sc-debug'),
      bubbles: el.querySelector('.sc-bubbles')
    };
    el.addEventListener('click', (e) => this.onStageTap(e));
    this.container.appendChild(el);
    preloadCharSprites();
  }

  setProps(partial) {
    Object.assign(this.props, partial || {});
    this.render();
  }

  // ---- 全量重渲染（静态图层 <img> 不动，无闪烁）----
  render() {
    const p = this.props;
    this.stage.classList.toggle('sc-hint', !!p.hint);

    // 灯光层不透明度
    const op = layerOpacity(p.lightTemp, p.lampOn, p.projectorOn);
    this.els.L2.style.opacity = op.L2;
    this.els.L3.style.opacity = op.L3;
    this.els.L4.style.opacity = op.L4;
    this.els.L5.style.opacity = op.L5;
    this.els.L5.hidden = !(op.L5 > 0);
    this.els.L6.style.opacity = op.L6;
    this.els.L7.style.opacity = op.L7;
    this.els.L7.hidden = !(op.L7 > 0);

    // 亮度调光层（lightBright；压暗房间世界，不影响 HUD）
    const bright = Math.max(0, Math.min(100, typeof p.lightBright === 'number' ? p.lightBright : 100));
    const dimOpacity = Number((0.55 * (1 - bright / 100)).toFixed(3));
    this.els.dim.style.opacity = dimOpacity;
    this.els.dim.hidden = !(dimOpacity > 0);

    // 地板 tint：clip-path 菱形由 room-map floorPolygon 唯一导出
    const hex = FLOOR_COLORS[p.floor] || FLOOR_COLORS['blue-gray'];
    const pts = sceneMap.floorPolygon()
      .map((pt) => `${pt.left.toFixed(2)}% ${pt.top.toFixed(2)}%`).join(', ');
    this.els.floorTint.style.clipPath = `polygon(${pts})`;
    this.els.floorTint.style.background = hexToRgba(hex, 0.45);

    // DIY 唱片墙槽位：前 N 个槽位放所选唱片板材
    const picks = Array.isArray(p.records) ? p.records : [];
    this.els.slots.innerHTML = '';
    SceneLayout.RECORD_SLOTS.slice(0, picks.length).forEach((slot, i) => {
      const img = document.createElement('img');
      img.className = 'sc-slot';
      img.src = assetUrl(`/assets/img/room/rec-plate-${picks[i]}.webp`);
      img.alt = '';
      img.style.left = `${slot.left}%`;
      img.style.top = `${slot.top}%`;
      img.style.width = `${slot.width}%`;
      img.style.height = `${slot.height}%`;
      this.els.slots.appendChild(img);
    });

    this.renderStack();
    this.renderHotspots();
    this.renderNowPlaying();
    this.renderBubbles();
    this.renderDebug();
  }

  // 家具（按 z）与角色（z = top%×10，同轴遮挡）合并排序 —— port of rebuildStack
  renderStack() {
    const p = this.props;
    const selected = Array.isArray(p.furniture) ? p.furniture : [];
    const furns = SceneLayout.FURNITURE
      .filter((f) => f.fixed || selected.includes(f.id))
      .map((f) => ({ type: 'furn', key: `f-${f.id}`, src: f.asset, z: f.z }));
    const chars = (p.characters || []).map((c) => {
      const depth = sceneMap.depthFor(c.y);
      // vignette 等构图允许显式覆盖 scale/z（对齐 gen-friends-vignettes.js 的 plan 语义）
      const scale = typeof c.scale === 'number' ? c.scale : depth.scale;
      const hPct = (SceneLayout.CHAR.baseHeight * scale) / 8.28;
      const wPct = hPct / SceneLayout.CHAR.spriteAspect;
      // zBoost：坐下等状态抬高遮挡层（显式 z 覆盖优先，zBoost 叠加其上）
      const z = (typeof c.z === 'number' ? c.z : depth.z) + (c.zBoost || 0);
      return { type: 'char', key: `c-${c.id}`, ...c, z, scale, wPct, shadowW: wPct * 0.62 };
    });
    const stack = furns.concat(chars).sort((a, b) => a.z - b.z);

    // 就地更新现存节点（z-index 决定遮挡顺序；appendChild 移动即重排）。
    // 严禁 innerHTML 清空重建——行走时每 28ms 一帧，清空会重置 CSS 动画并导致角色闪烁/消失。
    const seenChars = new Set();
    const seenFurns = new Set();
    const frag = document.createDocumentFragment();
    stack.forEach((item) => {
      let node;
      if (item.type === 'furn') {
        node = this.furnNodes && this.furnNodes.get(item.key);
        if (!node) {
          node = document.createElement('img');
          node.className = 'sc-ly';
          node.alt = '';
          node.src = assetUrl(item.src);
          node.onerror = () => console.error('[room-scene] furniture asset failed to load:', item.src);
          (this.furnNodes || (this.furnNodes = new Map())).set(item.key, node);
        }
        node.style.zIndex = item.z;
        seenFurns.add(item.key);
      } else {
        node = this.charNodes.get(item.id);
        if (!node) {
          node = document.createElement('div');
          node.className = 'sc-char';
          node.dataset.id = item.id;
          node.innerHTML = '<div class="sc-frame"><img class="sc-sprite" alt="" /></div><div class="sc-char-shadow"></div><div class="sc-char-name" hidden></div>';
          node.addEventListener('click', (e) => {
            e.stopPropagation();
            const cb = this.props.onCharTap;
            if (cb) cb({ id: node.dataset.id });
          });
          this.charNodes.set(item.id, node);
        }
        const frame = node.querySelector('.sc-frame');
        frame.className = `sc-frame sc-frame-${item.frame || 'idle'}`;
        const sprite = node.querySelector('.sc-sprite');
        sprite.classList.toggle('sc-flip', item.facing < 0);
        // 可选角色滤镜（vignette 变体：charHue/charSat，对齐 tools/gen-friends-vignettes.js 的 modulate 语义）
        sprite.style.filter = item.filter
          ? `${item.filter} drop-shadow(0 3px 4px rgba(20, 12, 6, 0.28))`
          : '';
        // spriteBase：角色资产名与 id 解耦（duo 中非 KIKI 好友复用 momo 精灵 + 色相滤镜变体）
        const src = assetUrl(item.spriteSrc || `/assets/img/char-${item.spriteBase || item.id}-${item.frame || 'idle'}.webp`);
        if (sprite.dataset.src !== src) {
          sprite.src = src;
          sprite.dataset.src = src;
        }
        // 解码失败必须暴露 URL，绝不隐藏角色节点
        sprite.onerror = () => console.error('[room-scene] character sprite failed to load:', src);
        node.style.left = `${item.x}%`;
        node.style.top = `${item.y}%`;
        node.style.width = `${item.wPct.toFixed(2)}%`;
        node.style.zIndex = item.z;
        node.style.transform = `translate(-50%, -100%) scale(${item.scale})`;
        // pointerNone：落座中的玩家角色点击穿透（落座锁要求"点沙发站起"必须可用——
        // 坐在坐垫上时角色 DOM 正好压住沙发热点中心，catchtap/stopPropagation 会吞掉站起点击）
        node.style.pointerEvents = item.pointerNone ? 'none' : '';
        const name = node.querySelector('.sc-char-name');
        if (item.label) {
          name.hidden = false;
          name.textContent = item.label;
        } else {
          name.hidden = true;
        }
        seenChars.add(item.id);
      }
      frag.appendChild(node);
    });
    // 移除已消失的角色/家具节点（其余就地更新，不重建）
    this.charNodes.forEach((node, id) => {
      if (!seenChars.has(id)) {
        node.remove();
        this.charNodes.delete(id);
      }
    });
    if (this.furnNodes) {
      this.furnNodes.forEach((node, key) => {
        if (!seenFurns.has(key)) {
          node.remove();
          this.furnNodes.delete(key);
        }
      });
    }
    this.els.zstack.appendChild(frag);
  }

  // 热点视图纯视觉化（不吞点击）；几何 = hitArea —— port of rebuildHotspots
  renderHotspots() {
    const p = this.props;
    this.els.hotspots.innerHTML = '';
    if (p.mode === 'preview') return;
    const selected = Array.isArray(p.furniture) ? p.furniture : [];
    const list = SceneLayout.FIXTURE_OBJECTS
      .map((o) => ({ id: o.id, icon: o.icon, name: o.name, z: o.z, left: o.left, top: o.top, width: o.width, height: o.height }))
      .concat(SceneLayout.FURNITURE
        .filter((f) => f.hotspot && (f.fixed || selected.includes(f.id)))
        .map((f) => ({ id: f.hotspot.id, icon: f.hotspot.icon, name: f.hotspot.name, z: f.z, ...f.hitArea })));
    list.forEach((o) => {
      const lit = (p.activeIds || []).includes(o.id) || o.id === p.nearId;
      const el = document.createElement('div');
      el.className = `sc-hotspot${lit ? ' sc-hotspot-lit' : ''}`;
      el.style.left = `${o.left}%`;
      el.style.top = `${o.top}%`;
      el.style.width = `${o.width}%`;
      el.style.height = `${o.height}%`;
      el.style.zIndex = o.z;
      const badge = document.createElement('div');
      badge.className = 'sc-hotspot-badge';
      const icon = document.createElement('span');
      icon.textContent = o.icon;
      const name = document.createElement('span');
      name.textContent = o.name;
      badge.append(icon, name);
      el.appendChild(badge);
      this.els.hotspots.appendChild(el);
    });
  }

  renderNowPlaying() {
    const p = this.props;
    const np = p.nowPlaying || { playing: false, title: '' };
    this.els.platter.hidden = !np.playing;
    this.els.platter.style.left = `${SceneLayout.PLATTER.left}%`;
    this.els.platter.style.top = `${SceneLayout.PLATTER.top}%`;
    this.els.wallBadge.hidden = !np.playing;
    if (np.playing) {
      this.els.wallBadge.style.left = `${SceneLayout.WALL_NOW_PLAYING.left}%`;
      this.els.wallBadge.style.top = `${SceneLayout.WALL_NOW_PLAYING.top}%`;
      this.els.wallBadge.textContent = `▶ 《${np.title}》`;
    }
  }

  renderBubbles() {
    this.els.bubbles.innerHTML = '';
    (this.props.bubbles || []).forEach((b) => {
      const el = document.createElement('div');
      el.className = `sc-bubble sc-bubble-${b.kind || 'info'}`;
      el.style.left = `${b.x}%`;
      el.style.top = `${b.y}%`;
      el.textContent = b.text;
      this.els.bubbles.appendChild(el);
    });
  }

  // Debug：红=hitArea（可点）蓝=collision（不可走）
  renderDebug() {
    const p = this.props;
    this.els.debug.innerHTML = '';
    if (!p.debug) return;
    const selected = Array.isArray(p.furniture) ? p.furniture : [];
    SceneLayout.FIXTURE_OBJECTS
      .concat(SceneLayout.FURNITURE.filter((f) => f.hotspot && (f.fixed || selected.includes(f.id))))
      .filter((o) => o.hitArea || o.left != null)
      .forEach((o) => {
        const area = o.hitArea || o;
        if (!area || area.width == null) return;
        const el = document.createElement('div');
        el.className = 'sc-dbg-hit';
        el.style.left = `${area.left}%`;
        el.style.top = `${area.top}%`;
        el.style.width = `${area.width}%`;
        el.style.height = `${area.height}%`;
        el.textContent = o.hotspot ? o.hotspot.id : o.id;
        this.els.debug.appendChild(el);
      });
    SceneLayout.FURNITURE
      .filter((f) => f.collision && (f.fixed || selected.includes(f.id)))
      .map((f) => ({ id: f.id, collision: f.collision }))
      .concat((SceneLayout.FIXED_COLLIDERS || []).map((c) => ({ id: c.id, collision: c.collision })))
      .forEach((c) => {
        const pts = [
          sceneMap.fromUV(c.collision.u0, c.collision.v0),
          sceneMap.fromUV(c.collision.u1, c.collision.v0),
          sceneMap.fromUV(c.collision.u1, c.collision.v1),
          sceneMap.fromUV(c.collision.u0, c.collision.v1)
        ].map((pt) => `${pt.left.toFixed(1)}% ${pt.top.toFixed(1)}%`).join(', ');
        const el = document.createElement('div');
        el.className = 'sc-dbg-col';
        el.style.clipPath = `polygon(${pts})`;
        this.els.debug.appendChild(el);
      });
  }

  // 命中管道：先查家具 hitArea（高 z 优先），命中才 furnituretap；否则交还给 floor 寻路
  onStageTap(e) {
    const rect = this.stage.getBoundingClientRect();
    if (!rect || !rect.width) return;
    const left = ((e.clientX - rect.left) / rect.width) * 100;
    const top = ((e.clientY - rect.top) / rect.height) * 100;
    const p = this.props;
    if (p.mode !== 'preview') {
      const selected = Array.isArray(p.furniture) ? p.furniture : [];
      const items = HIT_ITEMS.filter((it) => {
        const f = SceneLayout.FURNITURE.find((ff) => ff.hotspot && ff.hotspot.id === it.id);
        return !f || f.fixed || selected.includes(f.id);
      });
      const hit = hitTest(left, top, items);
      if (hit) {
        if (p.onFurnitureTap) p.onFurnitureTap({ id: hit.id });
        return;
      }
    }
    if (p.onStageTap) p.onStageTap({ left, top });
  }

  destroy() {
    this.stage.remove();
    this.charNodes.clear();
    if (this.furnNodes) this.furnNodes.clear();
  }
}

export default RoomScene;
