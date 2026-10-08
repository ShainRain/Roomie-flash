/**
 * Audio seam — no-op driver interface for the Player state machine.
 *
 * The whole project ships no audio assets (mock timer player, see
 * miniprogram/utils/player.js and WEB-DEMO-AUDIT §2.3). This module is the
 * documented attach point where a real HTML5 <audio> element can later be
 * wired in: implement the AudioDriver interface and call attachDriver().
 *
 * The player state machine does not depend on this module; drivers should
 * subscribe to state/player.js and mirror snapshots onto a media element
 * (play/pause/seek/currentTime), then report real time back via Player.seek().
 *
 * @typedef {Object} AudioDriver
 * @property {(track: Object) => void} load   — called when the track changes
 * @property {() => void} play
 * @property {() => void} pause
 * @property {(seconds: number) => void} seek
 * @property {() => void} [dispose]
 */

const noop = () => {};

const nullDriver = {
  load: noop,
  play: noop,
  pause: noop,
  seek: noop,
  dispose: noop
};

let driver = nullDriver;

export function attachDriver(next) {
  if (driver && driver !== nullDriver && driver.dispose) driver.dispose();
  driver = next || nullDriver;
}

export function getDriver() {
  return driver;
}

export default { attachDriver, getDriver };
