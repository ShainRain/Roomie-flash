/**
 * roomie_room store — ESM port of app.js normalizeRoom/saveRoom semantics.
 * Storage key: roomie_room (wx-compatible, via adapters/storage).
 * Adds a tiny pub/sub so pages can react to room config changes.
 */
import { getStorageSync, setStorageSync } from '../adapters/storage.js';

export const STORAGE_KEY = 'roomie_room';

const DEFAULT_ROOM = {
  floor: 'blue-gray',
  lightTemp: 2700,
  lightBright: 100,
  furniture: ['sofa', 'vinyl-player', 'lamp', 'plant', 'rug', 'projector', 'guitar', 'bookshelf', 'coffee']
};

// 旧版本缓存结构防御：字段缺失/类型错误一律回退默认值
export function normalizeRoom(raw) {
  const def = { ...DEFAULT_ROOM, furniture: DEFAULT_ROOM.furniture.slice() };
  if (!raw || typeof raw !== 'object') return def;
  return {
    floor: typeof raw.floor === 'string' ? raw.floor : def.floor,
    lightTemp: typeof raw.lightTemp === 'number' ? raw.lightTemp : def.lightTemp,
    lightBright: typeof raw.lightBright === 'number' ? Math.max(0, Math.min(100, raw.lightBright)) : def.lightBright,
    furniture: Array.isArray(raw.furniture) ? raw.furniture : def.furniture.slice()
  };
}

let room = normalizeRoom(getStorageSync(STORAGE_KEY));
const listeners = new Set();

export function getRoom() {
  return { ...room, furniture: room.furniture.slice() };
}

export function saveRoom(next) {
  room = normalizeRoom(next);
  setStorageSync(STORAGE_KEY, room);
  const snap = getRoom();
  listeners.forEach((fn) => {
    try { fn(snap); } catch (e) { console.error('[room-store] listener error', e); }
  });
  return snap;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export default { STORAGE_KEY, normalizeRoom, getRoom, saveRoom, subscribe };
