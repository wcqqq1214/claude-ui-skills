'use strict';
// Activity animation sheets and transitions between activities.
const STATUS_MARKS = {
  think: {frames: [16, 110, 15], seams: [54], label: 'Organizing content'},
  read: {frames: [21, 60, 19], label: 'Reading content'},
  write: {frames: [31, 60, 14], label: 'Writing content'},
  code: {frames: [16, 75, 9], seams: [18, 37, 56], label: 'Working with code'},
};
function createStatusMark(host, onEnter) {
  const strip = host.querySelector('.thinking-strip');
  const frameMs = 33.3333;
  const sheets = {grow: 10};
  for (const [activity, {frames}] of Object.entries(STATUS_MARKS)) {
    ['in', 'loop', 'out'].forEach((stage, index) => { sheets[`${activity}-${stage}`] = frames[index]; });
  }
  const images = Object.fromEntries(Object.keys(sheets).map(name => {
    const image = new Image();
    image.src = new URL(`components/status-assets/${name}.webp`, document.baseURI).href;
    return [name, image];
  }));
  const decoded = new Set(), pending = new Map();
  let activity = 'think', wanted = 'think', stage = 'dot';
  let revision = 0, animation = null, complete = null, seamTimer = null;
  const target = () => decoded.has(wanted) ? wanted : activity;
  function clearSeam() {
    clearTimeout(seamTimer);
    seamTimer = null;
  }
  function settle() {
    clearSeam();
    animation?.cancel();
    animation = null;
    host.dataset.phase = stage = 'done';
    const callback = complete;
    complete = null;
    callback?.();
  }
  function scheduleSeam() {
    clearSeam();
    if (stage !== 'loop' || target() === activity || complete || !animation || animation.currentTime === null) return;
    const time = Number(animation.currentTime);
    const seam = STATUS_MARKS[activity].seams?.map(frame => frame * frameMs).find(ms => ms > time + 50);
    if (seam === undefined) return; // No upcoming seam: finish this authored loop.
    const current = animation, run = revision;
    seamTimer = setTimeout(() => {
      if (run === revision && animation === current && target() !== activity && !complete) play('out', run);
    }, seam - time);
  }
  async function play(nextStage, run) {
    if (run !== revision) return;
    clearSeam();
    animation?.cancel();
    animation = null;
    stage = nextStage;
    const sheet = stage === 'grow' ? 'grow' : `${activity}-${stage}`;
    const frames = sheets[sheet];
    host.dataset.phase = sheet;
    strip.style.backgroundImage = `url("${images[sheet].src}")`;
    strip.style.height = `${frames * 20}px`;
    if (stage === 'in') onEnter(activity);
    let current;
    try {
      current = animation = strip.animate(
        Array.from({length: frames}, (_, frame) => ({transform: `translateY(-${frame * 20}px)`})),
        {duration: frames * frameMs, iterations: 1, easing: `steps(${frames}, jump-none)`, fill: 'forwards'}
      );
      scheduleSeam();
      await current.finished;
    } catch {
      if (run === revision && (!current || animation === current)) {
        clearSeam();
        host.dataset.phase = stage = 'dot';
        animation = null;
        if (complete) settle();
      }
      return;
    }
    if (run !== revision || animation !== current) return;
    if (stage === 'out') {
      if (complete) return settle();
      activity = target();
      return play('in', run);
    }
    if (stage === 'grow') {
      activity = target();
      return play('in', run);
    }
    // An entry completes before its loop; a changed target exits at a seam or loop end.
    play(complete || stage === 'loop' && target() !== activity ? 'out' : 'loop', run);
  }
  function select(nextActivity) {
    wanted = nextActivity;
    complete = null;
    const run = revision;
    if (!pending.has(wanted)) {
      const names = ['grow', ...['in', 'loop', 'out'].map(stage => `${wanted}-${stage}`)];
      pending.set(wanted, Promise.all(names.map(name => images[name].decode()))
        .then(() => { decoded.add(nextActivity); return true; }, () => false));
    }
    scheduleSeam();
    pending.get(wanted).then(ready => {
      if (!ready || run !== revision || wanted !== nextActivity || complete || stage === 'done') return;
      if (stage === 'dot') {
        activity = wanted;
        play('grow', run);
      } else scheduleSeam();
    });
  }
  return {
    start(nextActivity) {
      revision++;
      clearSeam();
      animation?.cancel();
      animation = null;
      host.dataset.phase = stage = 'dot';
      strip.style.backgroundImage = '';
      activity = nextActivity;
      select(nextActivity);
    },
    select,
    finish(callback) {
      complete = callback;
      clearSeam();
      if (!animation) { revision++; settle(); }
    },
  };
}
// ShimmerText secondary: a stable clone keeps the sweep phase when copy changes.
function createStatusShimmer(label, text) {
  const clone = document.createElement('span');
  clone.className = 'status-shimmer-clone';
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('translate', 'no');
  label.append(clone);
  const sync = () => { clone.textContent = label.dataset.shimmering === 'true' ? text.textContent : ''; };
  DemoI18n.onChange(sync);
  return (source, active) => {
    DemoI18n.text(text, () => DemoI18n.t(source));
    label.dataset.shimmering = String(active);
    sync();
  };
}
function initFeedbackDemo() {
  let activity = 'think';
  const setStatus = createStatusShimmer($('#loadingLabel'), $('#loadingText'));
  function showActivity(value) {
    setStatus(STATUS_MARKS[value].label, true);
    $('#statusCycle').textContent = `${Number((STATUS_MARKS[value].frames[1] / 30).toFixed(2))} s`;
  }
  const thinkingMark = createStatusMark($('#thinkingMark'), showActivity);
  const button = $('#skeletonBtn');
  let phase = 'working';
  let skeletonTimer = null;
  let skeletonObserver = null;
  const loadedTemplate = DemoI18n.clone($('#skeletonSlot'));
  function clearSkeleton() {
    clearTimeout(skeletonTimer);
    skeletonTimer = null;
    skeletonObserver?.disconnect();
    skeletonObserver = null;
  }
  function runSkeleton() {
    clearSkeleton();
    thinkingMark.start(activity);
    $('#skeletonSlot').replaceChildren();
    showActivity(activity);
    phase = 'working';
    button.removeAttribute('aria-disabled');
    DemoI18n.text(button, () => DemoI18n.t('Finish'));
    skeletonTimer = setTimeout(() => {
      $('#skeletonSlot').innerHTML =
        '<div class="skeleton-content" aria-label="Loading content"><div class="skeleton-sweep-clip" aria-hidden="true"><div class="skeleton-sweep-band"></div></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>';
      const group = $('#skeletonSlot .skeleton-content'),
        clip = group.querySelector('.skeleton-sweep-clip');
      DemoI18n.attr(group, 'aria-label', () => DemoI18n.t('Loading content'));
      // Clip one shared shimmer band to the rectangles of the direct-child rows.
      const updateClip = () => {
        const paths = [...group.querySelectorAll('.skeleton-line')].map(
          (row) =>
            `M${row.offsetLeft},${row.offsetTop}h${row.offsetWidth}v${row.offsetHeight}h${-row.offsetWidth}Z`
        );
        clip.style.clipPath = paths.length ? `path("${paths.join(' ')}")` : '';
        clip.style.visibility = paths.length ? 'visible' : 'hidden';
      };
      updateClip();
      skeletonObserver = new ResizeObserver(updateClip);
      skeletonObserver.observe(group);
    }, 500);
  }
  button.onclick = () => {
    if (phase === 'done') return runSkeleton();
    if (phase !== 'working') return;
    phase = 'finishing';
    button.setAttribute('aria-disabled', 'true');
    thinkingMark.finish(() => {
      clearSkeleton();
      $('#skeletonSlot').replaceChildren(...DemoI18n.clone(loadedTemplate).childNodes);
      setStatus('Example content is ready', false);
      phase = 'done';
      button.removeAttribute('aria-disabled');
      DemoI18n.text(button, () => DemoI18n.t('Replay'));
    });
  };
  const statusSegment = setupSegment($('#statusSegment'), next => {
    if (next === activity) return;
    activity = next;
    if (phase === 'done') return runSkeleton();
    phase = 'working';
    button.removeAttribute('aria-disabled');
    thinkingMark.select(next);
  });
  DemoI18n.onChange(() => statusSegment.refresh());
  runSkeleton();
  $('#timelineTrigger').onclick = () => {
    const open = $('#timelineTrigger').getAttribute('aria-expanded') !== 'true';
    $('#timelineTrigger').setAttribute('aria-expanded', String(open));
    $('#timelineBody').classList.toggle('open', open);
    $('#timelineBody').inert = !open;
  };
}
