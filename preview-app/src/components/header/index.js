/**
 * roomie-header — masthead. Port of miniprogram/components/roomie-header.
 * props: subtitle, live, liveText, avatar, avatarColor, share, pageTitle, pageSubtitle, onShare
 */
export function createHeader(container, props = {}) {
  const {
    subtitle = '深夜放映室 · 0731',
    live = true,
    liveText = 'LIVE',
    avatar = 'M',
    avatarColor = '#F0A93C',
    share = false,
    pageTitle = '',
    pageSubtitle = '',
    onShare
  } = props;

  const el = document.createElement('header');
  el.className = 'rh';
  el.innerHTML = `
    <div class="rh-top">
      <div class="rh-left">
        <div class="rh-brand en-serif">ROOMIE</div>
        <div class="rh-sub"></div>
      </div>
      <div class="rh-right">
        ${live ? '<div class="rh-live"><div class="rh-live-dot"></div><span class="rh-live-text"></span></div>' : ''}
        ${share ? '<button class="rh-share" aria-label="分享">↗</button>' : ''}
        <div class="rh-avatar"></div>
      </div>
    </div>
    ${pageTitle ? '<div class="rh-title-row"><div class="rh-title"></div><div class="rh-title-en en-serif"></div></div>' : ''}`;

  el.querySelector('.rh-sub').textContent = subtitle;
  const avatarEl = el.querySelector('.rh-avatar');
  avatarEl.textContent = avatar;
  avatarEl.style.background = avatarColor;
  if (live) el.querySelector('.rh-live-text').textContent = liveText;
  if (pageTitle) {
    el.querySelector('.rh-title').textContent = pageTitle;
    el.querySelector('.rh-title-en').textContent = pageSubtitle;
  }
  if (share) {
    el.querySelector('.rh-share').addEventListener('click', () => { if (onShare) onShare(); });
  }

  container.appendChild(el);

  return {
    el,
    destroy() { el.remove(); }
  };
}

export default createHeader;
