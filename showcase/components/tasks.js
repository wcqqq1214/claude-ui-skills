'use strict';
function initTasksDemo() {
  // Local task cards and local-only drag payload.
  const taskCards = $$('#taskGrid button');
  let selectedTask = null;
  taskCards.forEach((b, i) => {
    b.onclick = () => {
      selectedTask = selectedTask === i ? null : i;
      taskCards.forEach((x, j) => x.setAttribute('aria-expanded', String(j === selectedTask)));
      $('#taskDetail').hidden = selectedTask === null;
      DemoI18n.text($('#taskDetail'), () =>
        selectedTask === null
          ? ''
          : [
              DemoI18n.t('Done: reading rhythm and visual hierarchy organized.'),
              DemoI18n.t('Stopped: this is a local state example.'),
              DemoI18n.t('Incomplete: this is a local state example.')
            ][selectedTask]
      );
    };
    b.onkeydown = (e) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const next =
          taskCards[(i + (e.key === 'ArrowRight' ? 1 : taskCards.length - 1)) % taskCards.length];
        next.focus({ preventScroll: true });
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
  });
  const dragSource = $('#dragSource'),
    dropTarget = $('#dropTarget'),
    dropDemo = $('.drop-demo'),
    dropOverlay = dropDemo.querySelector('.drop-overlay');
  let localDragging = false,
    dropExit = null,
    dropRevision = 0;
  function showDropState(state) {
    const wasVisible = !dropOverlay.hidden,
      current = dropExit ? getComputedStyle(dropOverlay) : null,
      from = current ? { opacity: current.opacity, transform: current.transform } : null;
    dropRevision++;
    dropExit?.cancel();
    dropExit = null;
    dropDemo.dataset.state = state;
    dropOverlay.dataset.state = state;
    dropOverlay.hidden = false;
    if (wasVisible && from)
      dropOverlay.animate([from, { opacity: 1, transform: 'scale(1)' }], {
        duration: 150,
        easing: 'cubic-bezier(.215,.61,.355,1)'
      });
  }
  function finishDrop() {
    localDragging = false;
    dropDemo.dataset.state = 'idle';
    if (dropOverlay.hidden || dropExit) return;
    const revision = ++dropRevision,
      style = getComputedStyle(dropOverlay);
    dropExit = dropOverlay.animate(
      [
        { opacity: style.opacity, transform: style.transform },
        { opacity: 0, transform: 'scale(.95)' }
      ],
      { duration: 200, easing: 'ease-out', fill: 'forwards' }
    );
    dropExit.onfinish = () => {
      if (revision !== dropRevision) return;
      dropOverlay.hidden = true;
      dropExit.cancel();
      dropExit = null;
    };
  }
  function addLocalFile() {
    DemoI18n.text($('#dropHint'), () => DemoI18n.t('Added: design-notes.md (local page text only)'));
    finishDrop();
  }
  dragSource.ondragstart = (e) => {
    localDragging = true;
    showDropState('off');
    e.dataTransfer.setData('text/plain', 'local-design-note');
    e.dataTransfer.effectAllowed = 'copy';
  };
  dragSource.ondragend = finishDrop;
  dropTarget.ondragover = (e) => {
    if (!localDragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dropDemo.dataset.state !== 'on') showDropState('on');
  };
  dropTarget.ondragleave = (e) => {
    if (localDragging && !dropTarget.contains(e.relatedTarget)) showDropState('off');
  };
  dropTarget.ondrop = (e) => {
    if (!localDragging) return;
    e.preventDefault();
    addLocalFile();
  };
  dragSource.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addLocalFile();
    }
  };
  $('#resetDrop').onclick = () => {
    finishDrop();
    DemoI18n.text($('#dropHint'), () => DemoI18n.t('Drop here to see the target boundary'));
  };
}
