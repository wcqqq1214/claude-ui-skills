'use strict';
function initControlsDemo() {
  $('#controlsSlow').onclick = (e) => {
    const button = e.currentTarget;
    const slow = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(slow));
    $('#controls').dataset.slow = String(slow);
  };
  $('#demoSwitch').onclick = (e) => {
    const b = e.currentTarget;
    b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  };
  bindEffortPopover();
}

function bindEffortPopover() {
  const trigger = $('#effortPopoverTrigger'), popup = $('#effortPopover'),
    input = $('#effortRange'), track = $('#effortPopoverTrack'),
    label = $('#effortAnimatedLabel'), valueLabel = $('#effortPopoverValue'),
    reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Reuse the existing menu's four local sample labels; no model catalog or settings writes.
  const options = ['Low', 'Medium', 'High', 'Max'];
  let committed = 2, preview = 2, currentWord = null, press = null, outsidePress = false;
  function clearWords() {
    for (const animation of label.getAnimations({subtree: true})) animation.cancel();
    label.replaceChildren();
    currentWord = null;
  }
  function showLabel(index, animate = true) {
    const duration = 200 * Number(getComputedStyle(track).getPropertyValue('--controls-duration-scale') || 1);
    const direction = index > preview ? 1 : -1;
    const changed = index !== preview;
    preview = index;
    if (!animate || reduced.matches || !currentWord) {
      clearWords();
      currentWord = document.createElement('span');
      currentWord.className = 'effort-label-word';
      [0, .5, 1, 2].forEach((radius, i) => {
        const layer = document.createElement('span');
        layer.className = 'effort-label-layer';
        layer.textContent = options[index];
        layer.style.opacity = i === 0 ? '1' : '0';
        if (radius) layer.style.filter = `blur(${radius}px)`;
        currentWord.append(layer);
      });
      label.append(currentWord);
      return;
    }
    if (!changed) return;
    const old = currentWord;
    old.dataset.exiting = '';
    const exit = old.animate([
      {transform: getComputedStyle(old).transform, opacity: getComputedStyle(old).opacity},
      {transform: `translateY(${-direction * .55}em)`, opacity: 0}
    ], {duration, easing: 'ease-out', fill: 'forwards'});
    [...old.children].forEach((layer, i) => layer.animate(
      [{opacity: getComputedStyle(layer).opacity}, {opacity: i === 3 ? 1 : 0}],
      {duration, easing: 'ease-out', fill: 'forwards'}
    ));
    exit.finished.then(() => {
      for (const animation of old.getAnimations({subtree: true})) animation.cancel();
      old.remove();
    }, () => {});
    const word = document.createElement('span');
    word.className = 'effort-label-word';
    currentWord = word;
    label.append(word);
    const opacities = [[0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0]];
    [0, .5, 1, 2].forEach((radius, i) => {
      const layer = document.createElement('span');
      layer.className = 'effort-label-layer';
      layer.textContent = options[index];
      if (radius) layer.style.filter = `blur(${radius}px)`;
      word.append(layer);
      layer.animate(opacities[i].map((opacity, j) => ({
        opacity, offset: [0, .342, .563, 1][j], easing: j === 2 ? 'ease-out' : 'linear'
      })), {duration, fill: 'forwards'});
    });
    word.animate([
      {transform: `translateY(${direction * .55}em)`, opacity: 0},
      {transform: 'translateY(0em)', opacity: 1}
    ], {duration, easing: 'ease-out', fill: 'forwards'});
  }
  function render(index, animate = true) {
    showLabel(index, animate);
    input.value = String(index);
    input.setAttribute('aria-valuetext', options[index]);
    track.style.setProperty('--pos', String(index / (options.length - 1)));
  }
  function commit() {
    committed = preview;
    valueLabel.textContent = options[committed];
    DemoI18n.attr(trigger, 'aria-label', () => DemoI18n.t('Effort: {0}', options[committed]));
  }
  function release() {
    const previous = press;
    press = null;
    if (previous && track.hasPointerCapture(previous.id)) track.releasePointerCapture(previous.id);
    track.classList.remove('dragging');
    track.style.removeProperty('--lean');
  }
  function close(restore = true) {
    release();
    outsidePress = false;
    render(committed, false);
    if (popup.open) popup.close();
    trigger.setAttribute('aria-expanded', 'false');
    if (restore) trigger.focus({preventScroll: true});
  }
  function position() {
    if (!popup.open) return;
    const rect = trigger.getBoundingClientRect(), width = popup.offsetWidth, height = popup.offsetHeight;
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const right = left + (viewport?.width ?? innerWidth), bottom = top + (viewport?.height ?? innerHeight);
    popup.style.left = Math.max(left + 8, Math.min(rect.left + (rect.width - width) / 2, right - width - 8)) + 'px';
    popup.style.top = Math.max(top + 8, Math.min(rect.bottom + 6 + height <= bottom - 8
      ? rect.bottom + 6 : rect.top - height - 6, bottom - height - 8)) + 'px';
  }
  trigger.onclick = event => {
    if (popup.open) return close();
    render(committed, false);
    popup.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    position();
    // EffortControl initially focuses the popup for pointers, the slider for keyboard.
    (event.detail === 0 ? input : popup).focus({preventScroll: true});
  };
  popup.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      input.focus({preventScroll: true});
    }
  });
  popup.addEventListener('cancel', event => { event.preventDefault(); close(); });
  const outside = event => {
    const rect = popup.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  popup.addEventListener('pointerdown', event => { outsidePress = event.target === popup && outside(event); });
  popup.addEventListener('click', event => {
    if (outsidePress && event.target === popup && outside(event)) close();
    outsidePress = false;
  });
  function movePointer(event) {
    if (!press || press.id !== event.pointerId) return;
    const rect = track.querySelector('.range-carriage').getBoundingClientRect();
    if (rect.width <= 0) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - press.offset - rect.left) / rect.width));
    render(Math.round(fraction * (options.length - 1)));
    const distance = (fraction - preview / (options.length - 1)) * (options.length - 1);
    const lean = reduced.matches ? 0 : Math.round(Math.sign(distance) * Math.min(.12 * (1 - Math.exp(-Math.abs(distance) / .12)), .48) * rect.width / (options.length - 1) / .5) * .5;
    track.style.setProperty('--lean', lean + 'px');
  }
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0 || press) return;
    event.preventDefault();
    const rect = track.querySelector('.range-carriage').getBoundingClientRect();
    const delta = event.clientX - (rect.left + preview / (options.length - 1) * rect.width);
    const handleWidth = track.querySelector('.range-thumb').getBoundingClientRect().width;
    press = {id: event.pointerId, offset: Math.abs(delta) <= .7 * handleWidth / 2 ? delta : 0};
    track.setPointerCapture(event.pointerId);
    track.classList.add('dragging');
    input.focus({preventScroll: true});
    movePointer(event);
  });
  track.addEventListener('pointermove', event => {
    if (press && event.buttons === 0) { release(); render(committed, false); return; }
    movePointer(event);
  });
  track.addEventListener('pointerup', event => {
    if (press?.id !== event.pointerId) return;
    commit();
    release();
  });
  const cancelPress = event => {
    if (press?.id !== event.pointerId) return;
    release();
    render(committed, false);
  };
  track.addEventListener('pointercancel', cancelPress);
  track.addEventListener('lostpointercapture', cancelPress);
  input.addEventListener('keydown', event => {
    let next;
    const step = event.shiftKey ? 10 : 1;
    if (['ArrowUp', 'ArrowRight'].includes(event.key)) next = preview + step;
    else if (['ArrowDown', 'ArrowLeft'].includes(event.key)) next = preview - step;
    else if (event.key === 'PageUp') next = preview + 10;
    else if (event.key === 'PageDown') next = preview - 10;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    event.stopPropagation();
    release();
    render(Math.max(0, Math.min(options.length - 1, next)));
    commit();
  });
  input.addEventListener('input', () => { if (!press) { render(Number(input.value)); commit(); } });
  new MutationObserver(() => {
    if (!$('#controls').hasAttribute('data-active')) close(false);
  }).observe($('#controls'), {attributes: true, attributeFilter: ['data-active']});
  reduced.addEventListener('change', () => { render(preview, false); track.style.removeProperty('--lean'); });
  window.addEventListener('blur', () => {
    if (press) { release(); render(committed, false); }
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  window.addEventListener('pagehide', () => close(false));
  DemoI18n.onChange(position);
  render(committed, false);
  commit();
}
