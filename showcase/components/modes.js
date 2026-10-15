'use strict';
function initModesDemo() {
  // Sidebar pills: container-query folding and independent focus/selection.
  const modeTrack = $('#modeTrack'),
    modeButtons = [...modeTrack.querySelectorAll('button')];
  let selectedMode = modeButtons[0];
  function visibleModes() {
    return modeButtons.filter((b) => !b.hidden);
  }
  function positionMode(animate = false) {
    const thumb = modeTrack.querySelector('.mode-thumb'),
      left = selectedMode.offsetLeft,
      width = selectedMode.offsetWidth,
      at = `${left},${width}`;
    if (thumb.dataset.at === at) return;
    if (animate) {
      thumb.removeAttribute('data-snap');
      void thumb.offsetWidth;
    } else thumb.setAttribute('data-snap', '');
    thumb.style.width = width + 'px';
    thumb.style.transform = `translateX(${left}px)`;
    thumb.dataset.at = at;
  }
  function chooseMode(b) {
    selectedMode = b;
    modeButtons.forEach((x) => {
      if (x === b) x.setAttribute('aria-current', 'page');
      else x.removeAttribute('aria-current');
    });
    DemoI18n.text($('#modeSelection'), () =>
      DemoI18n.t('Selected {0} · Arrows move focus only', b.dataset.mode)
    );
    positionMode(true);
  }
  modeButtons.forEach((b) => {
    b.setAttribute('aria-label', b.dataset.mode);
    b.onclick = () => chooseMode(b);
    b.onkeydown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const options = visibleModes(),
        i = options.indexOf(b);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next =
          options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length];
        next.focus();
      }
    };
  });
  $('#modeWidth').oninput = (e) => {
    $('#modeContainer').style.width = e.target.value + 'px';
    $('#modeWidthOutput').textContent = e.target.value + ' px';
  };
  $('#modeCount').onclick = () => {
    const two = !modeTrack.classList.contains('two');
    modeTrack.classList.toggle('two', two);
    modeButtons[1].hidden = two;
    if (selectedMode.hidden) chooseMode(modeButtons[0]);
    DemoI18n.text($('#modeCount'), () =>
      two ? DemoI18n.t('Show 3 items') : DemoI18n.t('Show 2 items')
    );
    positionMode();
  };
  new ResizeObserver(() => positionMode()).observe(modeTrack);
  modeButtons.forEach((b) => new ResizeObserver(() => positionMode()).observe(b));
}
