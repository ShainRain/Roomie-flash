/**
 * Platform adapter — wx system/UI API surface on the web.
 * windowInfo / nextTick / showToast / showModal / showActionSheet (styled with tokens).
 * The toast/modal/action-sheet DOM is lazily mounted into #app.
 */

export function getWindowInfo() {
  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    // Web demo 自定安全区：无刘海，固定 20（与小程序默认值一致）
    statusBarHeight: 20,
    safeArea: { top: 0, bottom: window.innerHeight }
  };
}

export function nextTick(fn) {
  return Promise.resolve().then(fn);
}

function ensureOverlayRoot() {
  let root = document.getElementById('wx-overlay-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'wx-overlay-root';
    (document.getElementById('app') || document.body).appendChild(root);
  }
  return root;
}

let toastTimer = null;

export function showToast({ title = '', icon = 'none', duration = 1500 } = {}) {
  const root = ensureOverlayRoot();
  const old = root.querySelector('.wx-toast');
  if (old) old.remove();
  if (toastTimer) clearTimeout(toastTimer);
  const el = document.createElement('div');
  el.className = 'wx-toast';
  el.textContent = title;
  if (icon === 'success') el.dataset.icon = '✓';
  root.appendChild(el);
  toastTimer = setTimeout(() => el.remove(), duration);
}

/**
 * wx.showModal → Promise-based. Calls options.success({confirm,cancel}) when given,
 * and also returns a Promise<{confirm,cancel}>.
 */
export function showModal({ title = '', content = '', confirmText = '确定', cancelText = '取消', showCancel = true, success } = {}) {
  const root = ensureOverlayRoot();
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'wx-modal-mask';
    wrap.innerHTML = `
      <div class="wx-modal">
        ${title ? `<div class="wx-modal-title"></div>` : ''}
        <div class="wx-modal-content"></div>
        <div class="wx-modal-btns">
          ${showCancel ? '<button class="wx-modal-btn wx-modal-cancel"></button>' : ''}
          <button class="wx-modal-btn wx-modal-confirm"></button>
        </div>
      </div>`;
    if (title) wrap.querySelector('.wx-modal-title').textContent = title;
    wrap.querySelector('.wx-modal-content').textContent = content;
    const confirmBtn = wrap.querySelector('.wx-modal-confirm');
    confirmBtn.textContent = confirmText;
    const cancelBtn = wrap.querySelector('.wx-modal-cancel');
    if (cancelBtn) cancelBtn.textContent = cancelText;
    const done = (confirm) => {
      wrap.remove();
      const res = { confirm, cancel: !confirm };
      if (success) success(res);
      resolve(res);
    };
    confirmBtn.addEventListener('click', () => done(true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => done(false));
    root.appendChild(wrap);
  });
}

/**
 * wx.showActionSheet({ itemList }) → Promise<{tapIndex}> + options.success callback.
 */
export function showActionSheet({ itemList = [], success } = {}) {
  const root = ensureOverlayRoot();
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'wx-sheet-mask';
    const sheet = document.createElement('div');
    sheet.className = 'wx-sheet';
    itemList.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.className = 'wx-sheet-item';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        wrap.remove();
        const res = { tapIndex: i };
        if (success) success(res);
        resolve(res);
      });
      sheet.appendChild(btn);
    });
    const cancel = document.createElement('button');
    cancel.className = 'wx-sheet-item wx-sheet-cancel';
    cancel.textContent = '取消';
    cancel.addEventListener('click', () => { wrap.remove(); resolve({ tapIndex: -1, cancelled: true }); });
    sheet.appendChild(cancel);
    wrap.appendChild(sheet);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) { wrap.remove(); resolve({ tapIndex: -1, cancelled: true }); }
    });
    root.appendChild(wrap);
  });
}

export default { getWindowInfo, nextTick, showToast, showModal, showActionSheet };
