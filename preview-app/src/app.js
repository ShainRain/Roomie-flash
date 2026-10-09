/**
 * Roomie Web Demo — bootstrap
 * Route registration + storage seed (parity with miniprogram app.js onLaunch).
 */
import './styles/tokens.css';
import './styles/components.css';
import './styles/app.css';
import './components/room-scene/room-scene.css';
import './components/player/mini-player.css';
import './components/tabbar/tabbar.css';
import './components/header/header.css';

import * as router from './router/router.js';
import { getStorageSync, setStorageSync } from './adapters/storage.js';

import home from './pages/home.js';
import room from './pages/room.js';
import friends from './pages/friends.js';
import duo from './pages/duo.js';
import architect from './pages/architect.js';
import song from './pages/song.js';
import profile from './pages/profile.js';
import postcard from './pages/postcard.js';
import { assetUrl } from './utils/asset-url.js';

// Oranienbaum 刊头字体：经 JS 注入 @font-face（url 走 assetUrl，部署子路径安全）
const fontFace = document.createElement('style');
fontFace.textContent = `@font-face { font-family: 'Oranienbaum'; src: url('${assetUrl('/fonts/Oranienbaum-Regular.ttf')}') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }`;
document.head.appendChild(fontFace);

// app.js onLaunch parity：未读角标初始值（mock：2 条未读邀请/动态）
if (!getStorageSync('roomie_unread')) setStorageSync('roomie_unread', 2);

router.register('/', home);
router.register('/home', home); // 显式别名：深链 #/home 与 / 等价
router.register('/room', room);
router.register('/friends', friends);
router.register('/duo', duo);
router.register('/architect', architect);
router.register('/song', song);
router.register('/profile', profile);
router.register('/postcard', postcard);
router.setNotFound(home);

router.start(document.getElementById('app'));
