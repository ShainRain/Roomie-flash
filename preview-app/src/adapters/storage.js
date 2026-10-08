/**
 * wx-style sync storage API on localStorage.
 * wx-compatible semantics: missing key → '' ; values JSON-serialized
 * (wx stores typed values; JSON round-trip preserves arrays/objects/numbers).
 * All keys used by the app: roomie_room / roomie_records / roomie_unread / roomie_avatar / roomie_outfit
 */

export function getStorageSync(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return '';
    return JSON.parse(raw);
  } catch (e) {
    return '';
  }
}

export function setStorageSync(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] setStorageSync failed', key, e);
  }
}

export function removeStorageSync(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error('[storage] removeStorageSync failed', key, e);
  }
}

export default { getStorageSync, setStorageSync, removeStorageSync };
