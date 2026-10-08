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

// app.js onLaunch parity：未读角标初始值（mock：2 条未读邀请/动态）
if (!getStorageSync('roomie_unread')) setStorageSync('roomie_unread', 2);

router.register('/', home);
router.register('/room', room);
router.register('/friends', friends);
router.register('/duo', duo);
router.register('/architect', architect);
router.register('/song', song);
router.register('/profile', profile);
router.register('/postcard', postcard);
router.setNotFound(home);

router.start(document.getElementById('app'));
