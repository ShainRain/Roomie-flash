// state/player.js 行为测试（Web 手动移植版语义：歌单 3 首，Aruarian 首曲，真实音频层在
// Node 环境无 Audio 对象自动降级 mock 走秒——与小程序 Node 测试降级路径一致）
import Player from '../src/state/player.js';

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

// 1. 初始快照
let snap = Player.snapshot();
assert(snap.track.title === 'Aruarian_Dance', '初始曲目为《Aruarian_Dance》（新用户首曲）');
assert(snap.playing === false, '初始为暂停态');
assert(snap.position === 0, '初始进度 0s');
assert(snap.durationText === '4:10', '时长格式化 4:10');
assert(snap.positionText === '0:00', '进度格式化 0:00');
assert(snap.playlistLength === 3, '歌单 3 首');
assert(snap.track.audioAvailable === true && !!snap.track.src, '首曲为真实音频（audioAvailable + src）');

// 2. 歌词索引
assert(snap.lyricIndex === 0, '0s 落在第 1 个段落标签（index 0）');

// 3. 播放/暂停
Player.toggle();
assert(Player.snapshot().playing === true, 'toggle 后播放中');
Player.toggle();
assert(Player.snapshot().playing === false, '再次 toggle 暂停');

// 4. 切歌
Player.next();
snap = Player.snapshot();
assert(snap.track.title === '蓝调时刻', 'next 切到《蓝调时刻》');
assert(snap.position === 0, '切歌进度归零');
assert(snap.track.audioAvailable === false, '占位曲目如实标注 audioAvailable=false');
Player.next();
Player.next();
snap = Player.snapshot();
assert(snap.track.title === 'Aruarian_Dance', 'next 三回首曲（循环）');
Player.prev();
snap = Player.snapshot();
assert(snap.track.title === '雾窗', 'prev 回退到《雾窗》（循环）');

// 5. seek
Player.seek(50);
snap = Player.snapshot();
assert(snap.position === Math.round(210 * 0.5), 'seek 50% 定位到时长中点');
assert(snap.progress === 50, '进度百分比 50');

// 6. seek 后段落标签索引联动
Player.switchTo(0, false);
Player.seek(10); // 25s → 第 1 行（t=0，下一行 t=30）
snap = Player.snapshot();
assert(snap.lyricIndex === 0, 'seek 后段落索引联动（25s → index 0）');

// 7. playTrack
assert(Player.playTrack('bluehour', false) === true, 'playTrack 命中 bluehour');
assert(Player.snapshot().index === 1, 'playTrack 切到 index 1');
assert(Player.playTrack('not-a-track') === false, 'playTrack 未命中返回 false');

// 8. 订阅/退订
let calls = 0;
const unsub = Player.subscribe(() => calls++);
assert(calls === 1, 'subscribe 立即推送一次快照');
Player.toggle();
assert(calls === 2, '状态变更推送快照');
unsub();
Player.toggle();
assert(calls === 2, '退订后不再推送');

// 9. applyRemote：对端播放状态应用（last-write-wins，2.5s 容差）
let remoteSource = '';
Player.subscribe((snap2, source) => { remoteSource = source; });
Player.switchTo(0, false);
Player.applyRemote({ index: 2, position: 100, playing: true, sentAt: Date.now() });
snap = Player.snapshot();
assert(snap.index === 2 && snap.track.title === '雾窗', 'remote 切歌生效');
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
