'use strict';
function initTasksDemo() {
  initProgressDemo();
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
        easing: easeOutCubic
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

function initProgressDemo() {
  const chapter = $('#tasks'), list = $('#progressList'), foldButton = $('#progressFold');
  const fold = $('#progressEarlier'), foldedRows = fold.firstElementChild;
  const currentRows = list.querySelector('.progress-current');
  const marks = list.querySelector('.progress-fold-marks');
  const replay = $('#replayProgress'), count = $('#progressCount');
  const samples = [
    ['Read the design notes', 'Reading the design notes'],
    ['Group related ideas', 'Grouping related ideas'],
    ['Outline the document', 'Outlining the document'],
    ['Write the first draft', 'Writing the first draft'],
    ['Check the wording', 'Checking the wording'],
    ['Prepare the summary', 'Preparing the summary'],
  ];
  let todos = ['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending'];
  let expanded = false, timers = [], visible = false;
  const rows = samples.map(() => {
    const row = document.createElement('div');
    row.className = 'progress-row';
    const track = document.createElement('span');
    track.className = 'progress-track'; track.setAttribute('aria-hidden', 'true');
    const rail = document.createElement('span'); rail.className = 'progress-rail';
    const walked = document.createElement('span'); walked.className = 'progress-walked';
    rail.append(walked); track.append(rail);
    const label = document.createElement('span'); label.className = 'progress-text';
    const shimmer = createProgressShimmer();
    label.append(shimmer.element);
    const status = document.createElement('span'); status.className = 'sr-only';
    row.append(track, label, status);
    return {row, track, rail, walked, label, shimmer, status, node: null};
  });
  for (let i = 0; i < 4; i++) marks.append(document.createElement('span'));
  function foldCount() {
    let leading = 0;
    while (todos[leading] === 'completed') leading++;
    return Math.max(0, leading - 2);
  }
  function updateCopy() {
    const n = foldCount();
    count.textContent = DemoI18n.t('{0} of {1}', todos.filter(s => s === 'completed').length, todos.length);
    $('#progressFoldText').textContent = expanded ? DemoI18n.t('Hide earlier steps') : DemoI18n.t(n === 1 ? '{0} earlier step' : '{0} earlier steps', n);
    todos.forEach((state, i) => {
      const r = rows[i];
      r.shimmer.update(state === 'in_progress', DemoI18n.t(samples[i][state === 'in_progress' ? 1 : 0]));
      r.status.textContent = ', ' + DemoI18n.t(state === 'completed' ? 'Done' : state === 'in_progress' ? 'In progress' : 'Not started');
    });
  }
  function updateFold() {
    foldButton.setAttribute('aria-expanded', String(expanded));
    fold.dataset.expanded = String(expanded);
    fold.inert = !expanded;
    updateCopy();
  }
  // Reconcile stable rows: unchanged content must not restart entrance or shimmer.
  function place(parent, desired) {
    desired.forEach((row, i) => { if (parent.children[i] !== row) parent.insertBefore(row, parent.children[i] || null); });
    [...parent.children].forEach(row => { if (!desired.includes(row)) row.remove(); });
  }
  function render(previous = todos) {
    const n = foldCount(), allDone = todos.every(s => s === 'completed');
    const lastWalked = allDone ? -1 : todos.findLastIndex(s => s !== 'pending');
    if (!n) expanded = false;
    foldButton.hidden = fold.hidden = n === 0;
    list.dataset.allDone = String(allDone);
    list.querySelector('.progress-sweep').dataset.building = String(todos.length > 0 && todos.every(s => s === 'pending'));
    [...marks.children].forEach((mark, i) => {
      mark.hidden = i >= n;
      mark.style.opacity = n > 4 && i === 3 ? '.1' : ['', '.7', '.45', '.25'][i];
    });
    todos.forEach((state, i) => {
      const r = rows[i], inFold = i < n, entering = !inFold && i >= previous.length;
      const wasFolded = r.row.dataset.folded === 'true';
      r.row.dataset.state = state; r.row.dataset.folded = String(inFold);
      r.row.dataset.first = String(i === 0); r.row.dataset.last = String(i === todos.length - 1);
      r.row.dataset.finished = String(allDone && i === todos.length - 1);
      // Moving into or out of the folded parent resets the row without an entry animation.
      if (entering || inFold !== wasFolded) {
        r.label.classList.toggle('progress-step-enter', entering);
        r.rail.classList.toggle('progress-rail-enter', entering);
      }
      r.walked.dataset.walk = i > lastWalked ? 'none' : i === lastWalked && state === 'in_progress' ? 'to-node' : 'whole';
      const kind = inFold ? null : state === 'in_progress' ? 'current' : allDone && i === todos.length - 1 ? 'finished' : null;
      if (r.node?.dataset.kind !== kind) {
        r.node?.remove(); r.node = null;
        if (kind) {
          r.node = document.createElement('span');
          r.node.dataset.kind = kind; r.node.className = 'progress-node';
          if (kind === 'current' && previous[i] !== 'in_progress' && !inFold) r.node.classList.add('progress-node-enter');
          if (kind === 'current') {
            const clay = document.createElement('span'); clay.className = 'progress-clay';
            clay.addEventListener('animationstart', () => {
              for (const animation of clay.getAnimations()) {
                const timing = animation.effect?.getTiming();
                if (timing?.iterations === Infinity && typeof timing.duration === 'number' && timing.duration > 0)
                  animation.startTime = -(performance.timeOrigin % timing.duration);
              }
            });
            r.node.append(clay);
          }
          if (kind === 'finished') r.node.append(DemoIcons.create('CheckCircleFilled', 16));
          r.track.append(r.node);
        }
      }
    });
    place(foldedRows, rows.slice(0, n).map(r => r.row));
    place(currentRows, rows.slice(n, todos.length).map(r => r.row));
    updateFold();
  }
  function stop() { timers.forEach(clearTimeout); timers = []; }
  function restart() {
    stop(); expanded = false;
    rows.forEach(r => {
      r.shimmer.update(false, '');
      r.row.remove(); r.node?.remove(); r.node = null;
      r.label.classList.remove('progress-step-enter'); r.rail.classList.remove('progress-rail-enter');
    });
    todos = Array(3).fill('pending'); render(todos);
    const frames = [
      ['in_progress', 'pending', 'pending'],
      ['completed', 'in_progress', 'pending'],
      ['completed', 'completed', 'in_progress', 'pending', 'pending', 'pending'],
      ['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending'],
      ['completed', 'completed', 'completed', 'completed', 'in_progress', 'pending'],
      ['completed', 'completed', 'completed', 'completed', 'completed', 'in_progress'],
      Array(6).fill('completed'),
    ];
    frames.forEach((frame, i) => timers.push(setTimeout(() => {
      const previous = todos; todos = frame; render(previous);
    }, 1800 + i * 1600)));
  }
  foldButton.onclick = () => { expanded = !expanded; updateFold(); };
  replay.onclick = restart;
  // Demo playback only: leaving the example cancels pending sample changes.
  function syncVisibility() {
    const active = visible && !document.hidden && chapter.hasAttribute('data-active');
    list.dataset.playing = String(active);
    if (!active) stop();
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVisibility(); }).observe(list);
  new MutationObserver(syncVisibility).observe(chapter, {attributes: true, attributeFilter: ['data-active']});
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pagehide', stop);
  DemoI18n.onChange(updateCopy);
  render(); syncVisibility();
}

// Shimmer animation for the flat progress list.
function createProgressShimmer() {
  const element = document.createElement('span');
  element.className = 'status-shimmer';
  const text = document.createTextNode('');
  element.append(text);
  const view = element.ownerDocument.defaultView;
  const compositing = view.CSS?.supports('(-webkit-mask-clip: text) and (-webkit-app-region: drag)');
  let active = false, eligible = true, clone = null, observer = null, lastText = null;
  function band(node) {
    return node?.getAnimations?.({subtree: true}).find(animation =>
      animation.effect?.target === node && animation.effect.pseudoElement === '::after');
  }
  function eligibleLayout() {
    const style = view.getComputedStyle(element);
    if (!['block', 'inline-block', 'flow-root', 'list-item'].includes(style.display) ||
        style.webkitLineClamp !== 'none') return false;
    let parent = element.parentElement;
    for (let depth = 0; parent && depth < 16; depth++, parent = parent.parentElement) {
      const style = view.getComputedStyle(parent);
      if (style.webkitLineClamp !== 'none') return false;
      if (!['block', 'flow-root', 'list-item', 'contents', 'inline'].includes(style.display)) break;
    }
    return true;
  }
  function render() {
    const mode = !active ? 'inactive' : compositing && eligible ? 'composited' : 'fallback';
    element.dataset.shimmering = String(active);
    element.dataset.shimmerMode = mode;
    if (mode !== 'composited') {
      clone?.remove(); clone = null; lastText = null;
      return;
    }
    if (clone && lastText === text.data) return;
    const animation = band(clone);
    const start = animation?.startTime, time = animation?.currentTime;
    const next = document.createElement('span');
    next.className = 'status-shimmer-clone';
    next.setAttribute('aria-hidden', 'true'); next.setAttribute('translate', 'no'); next.inert = true;
    next.textContent = text.data;
    if (clone) clone.replaceWith(next); else element.append(next);
    clone = next; lastText = text.data;
    const replacement = band(clone);
    if (replacement) {
      if (typeof start === 'number' && replacement.playState === 'running') replacement.startTime = start;
      else if (typeof time === 'number') replacement.currentTime = time;
    }
  }
  return {element, update(nextActive, content) {
    const changed = nextActive !== active;
    active = nextActive;
    if (text.data !== content) text.data = content;
    if (changed) {
      observer?.disconnect(); observer = null;
      eligible = true;
      if (active && compositing && !view.ResizeObserver) eligible = false;
    }
    render();
    // Check the laid-out host and clone once per activation.
    if (changed && active && compositing && view.ResizeObserver) {
      observer = new view.ResizeObserver(() => {
        observer.disconnect(); eligible = eligibleLayout(); render();
      });
      try {
        observer.observe(element);
        if (clone) observer.observe(clone);
      } catch {
        observer.disconnect(); eligible = false; render();
      }
    }
  }};
}
