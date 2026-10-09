/**
 * wx navigation adapter → hash router.
 * wx page paths map to hash routes: /pages/room/room → #/room
 */
import * as router from '../router/router.js';

const PATH_MAP = {
  '/pages/home/home': '/',
  '/pages/room/room': '/room',
  '/pages/friends/friends': '/friends',
  '/pages/duo/duo': '/duo',
  '/pages/architect/architect': '/architect',
  '/pages/song/song': '/song',
  '/pages/profile/profile': '/profile',
  '/pages/postcard/postcard': '/postcard',
  '/pages/create/create': '/architect',
  '/pages/messages/messages': '/messages'
};

function toHash(url) {
  if (!url) return '/';
  const [pathPart, query] = url.split('?');
  const path = PATH_MAP[pathPart] || (pathPart.startsWith('/') ? pathPart : `/${pathPart}`);
  return query ? `${path}?${query}` : path;
}

export function navigateTo({ url }) {
  router.navigate(toHash(url));
}

export function navigateBack() {
  router.back();
}

export function switchTab({ url }) {
  router.navigate(toHash(url));
}

export function redirectTo({ url }) {
  router.navigate(toHash(url), { replace: true });
}

export default { navigateTo, navigateBack, switchTab, redirectTo };
