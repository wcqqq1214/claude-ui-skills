'use strict';

// Shared by the reading views, status selector and compact file-view control.
function setupSegment(root, callback) {
  const buttons = [...root.querySelectorAll('[role=radio]')];
  const thumb = root.querySelector('.segment-thumb');
  // Same curve as --ease-snap; kept local so setupSegment() needs no shared.js.
  const easing = 'cubic-bezier(.32,.72,0,1)';
  let selected = buttons.findIndex(button => button.getAttribute('aria-checked') === 'true');
  let geometry = null;
  let animation = null;

  function position(animate) {
    const selectedButton = buttons[selected];
    const buttonRect = selectedButton.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const style = getComputedStyle(root);
    const dpr = window.devicePixelRatio || 1;

    let layoutWidth = parseFloat(style.width);
    if (style.boxSizing !== 'border-box') {
      layoutWidth += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    }

    // Round both edges in viewport pixels, then return to local CSS coordinates.
    const measuredScale = Math.abs(rootRect.width - layoutWidth) < .01
      ? 1 : rootRect.width / layoutWidth;
    const validScale = measuredScale > 0 && Number.isFinite(measuredScale);
    const scale = validScale ? measuredScale : 1;
    const round = value => Math.round(value * dpr) / dpr;
    const left = validScale
      ? (round(buttonRect.left) - round(rootRect.left)) / scale
      : selectedButton.offsetLeft;
    const width = validScale
      ? (round(buttonRect.right) - round(buttonRect.left)) / scale
      : selectedButton.offsetWidth;

    if (!(width > 0) || geometry && geometry.left === left && geometry.width === width) return;

    // Read the visible position before cancelling an interrupted animation.
    const current = thumb.getBoundingClientRect();
    const old = geometry ? {
      left: (current.left - rootRect.left) / scale,
      width: current.width / scale,
    } : null;

    animation?.cancel();
    thumb.style.width = width + 'px';
    thumb.style.transform = `translateX(${left}px)`;
    if (animate && old) {
      animation = thumb.animate([
        { transform: `translateX(${old.left}px) scaleX(${old.width / width})` },
        { transform: `translateX(${left}px) scaleX(1)` },
      ], { duration: 200, easing });
    }
    geometry = { left, width };
  }

  function select(index, focus = false) {
    selected = (index + buttons.length) % buttons.length;
    buttons.forEach((button, i) => {
      button.setAttribute('aria-checked', i === selected ? 'true' : 'false');
      button.tabIndex = i === selected ? 0 : -1;
    });
    position(true);
    callback(buttons[selected].dataset.value);
    if (focus) buttons[selected].focus();
  }

  buttons.forEach((button, i) => button.onclick = () => select(i));
  root.addEventListener('keydown', event => {
    let next;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = selected + 1;
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = selected - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    select(next, true);
  });

  new ResizeObserver(() => position(false)).observe(root);
  position(false);
  callback(buttons[selected].dataset.value);
  return { select, refresh: () => position(false) };
}
