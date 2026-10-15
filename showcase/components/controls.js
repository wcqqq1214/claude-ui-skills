'use strict';
function initControlsDemo() {
  $('#demoSwitch').onclick = (e) => {
    const b = e.currentTarget;
    b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  };
  const effort = $('#effortRange');
  function updateEffort() {
    const i = Number(effort.value);
    effort.closest('.range-shell').style.setProperty('--pos', String(i / 3));
    const label = () => DemoI18n.t('Level {0} of {1}', i + 1, 4);
    DemoI18n.attr(effort, 'aria-valuetext', label);
  }
  effort.oninput = updateEffort;
  effort.onpointerdown = () => effort.closest('.range-shell').classList.add('dragging');
  function stopRange() {
    effort.closest('.range-shell').classList.remove('dragging');
  }
  window.addEventListener('pointerup', stopRange);
  window.addEventListener('pointercancel', stopRange);
  effort.onblur = stopRange;
}
