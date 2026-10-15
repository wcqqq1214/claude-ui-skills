'use strict';
function initControlsDemo() {
  $('#demoSwitch').onclick = (e) => {
    const b = e.currentTarget;
    b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  };
  const effort = $('#effortRange'),
    effortNames = ['Low', 'Medium', 'High', 'Max'],
    effortText = [
      'Quickly check a simple idea.',
      'Balance speed and deliberation.',
      'Leave more room to work through complex questions.',
      'Give closer comparisons more attention.'
    ];
  function updateEffort() {
    const i = Number(effort.value);
    effort.closest('.range-shell').style.setProperty('--pos', String(i / 3));
    DemoI18n.attr(effort, 'aria-valuetext', () => DemoI18n.t(effortNames[i]));
    DemoI18n.text($('#effortOutput'), () => DemoI18n.t(effortNames[i]));
    DemoI18n.text($('#effortDescription'), () => DemoI18n.t(effortText[i]));
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
