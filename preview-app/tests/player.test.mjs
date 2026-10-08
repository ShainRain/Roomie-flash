// utils/player.js 行为测试 — port of tools/test-player.js (plain node asserts)
// Module path adjusted to the web demo ESM port; assertions unchanged.
import Player from '../src/state/player.js';

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

// 1. 初始快照
let snap = Player.snapshot();
assert(snap.track.title === '晴天', '初始曲目为《晴天》');
assert(snap.playing === false, '初始为暂停态');
assert(snap.position === 134, '初始进度 134s');
assert(snap.durationText === '4:29', '时长格式化 4:29');
assert(snap.positionText === '2:14', '进度格式化 2:14');
assert(snap.playlistLength === 3, '歌单 3 首');

// 2. 歌词索引
assert(snap.lyricIndex === 5, '134s 落在第 6 行歌词（index 5）');

// 3. 播放/暂停
Player.toggle();
assert(Player.snapshot().playing === true, 'toggle 后播放中');
Player.toggle();
assert(Player.snapshot().playing === false, '再次 toggle 暂停');

// 4. 切歌
Player.next();
snap = Player.snapshot();
assert(snap.track.title === '花海', 'next 切到《花海》');
assert(snap.position === 0, '切歌进度归零');
Player.next();
Player.next();
snap = Player.snapshot();
assert(snap.track.title === '晴天', 'next 三回到《晴天》（循环）');
Player.prev();
snap = Player.snapshot();
assert(snap.track.title === '夜曲', 'prev 回退到《夜曲》（循环）');

// 5. seek
Player.seek(50);
snap = Player.snapshot();
assert(snap.position === Math.round(226 * 0.5), 'seek 50% 定位到时长中点');
assert(snap.progress === 50, '进度百分比 50');

// 6. seek 后歌词索引联动
Player.switchTo(0, false);
Player.seek(10); // 26.9s → 第 2 行（t=26）
snap = Player.snapshot();
assert(snap.lyricIndex === 1, 'seek 后歌词索引联动（26.9s → index 1）');

// 7. 订阅/退订
let calls = 0;
const unsub = Player.subscribe(() => calls++);
assert(calls === 1, 'subscribe 立即推送一次快照');
Player.toggle();
assert(calls === 2, '状态变更推送快照');
unsub();
Player.toggle();
assert(calls === 2, '退订后不再推送');

// 8. applyRemote：对端播放状态应用（last-write-wins，2.5s 容差）
let remoteSource = '';
Player.subscribe((snap2, source) => { remoteSource = source; });
Player.switchTo(0, false);
Player.applyRemote({ index: 2, position: 100, playing: true, sentAt: Date.now() });
snap = Player.snapshot();
assert(snap.index === 2 && snap.track.title === '夜曲', 'remote 切歌生效');
assert(snap.playing === true, 'remote playing 生效');
assert(remoteSource === 'remote', 'remote 应用带 source 标记（防止回播）');
Player.applyRemote({ index: 2, position: snap.position + 1.2, playing: true, sentAt: Date.now() });
const before = Player.snapshot().position;
Player.applyRemote({ index: 2, position: before + 1.0, playing: true, sentAt: Date.now() });
assert(Math.abs(Player.snapshot().position - before) < 0.01, '进度误差 ≤2.5s 不校正');
Player.applyRemote({ index: 2, position: before + 30, playing: true, sentAt: Date.now() });
assert(Player.snapshot().position > before + 20, '进度误差 >2.5s 校正到对端位置');
Player.applyRemote({ index: 2, position: 50, playing: false, sentAt: Date.now() - 60000 });
assert(Player.snapshot().playing === false, 'remote 暂停生效');

console.log(`\n结果：${passed} 通过，${failed} 失败`);
process.exit(failed ? 1 : 0);
