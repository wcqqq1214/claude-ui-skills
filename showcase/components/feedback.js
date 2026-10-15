'use strict';
// Thinking animation: 48px frames displayed in a 20px slot.
function createThinkingMark(host) {
  const strip = host.querySelector('.thinking-strip');
  const sheets = {grow: 10, 'think-in': 16, 'think-loop': 110, 'think-out': 15};
  const frameMs = 33.3333;
  const images = Object.fromEntries(Object.keys(sheets).map(name => {
    const image = new Image();
    image.src = new URL(`components/status-assets/${name}.webp`, document.baseURI).href;
    return [name, image];
  }));
  const ready = Promise.all(Object.values(images).map(image => image.decode()));
  // Keep the static dot if artwork is unavailable.
  ready.catch(() => {});
  let revision = 0, animation = null, complete = null;
  function reset() {
    revision++;
    animation?.cancel();
    animation = null;
    complete = null;
    host.dataset.phase = 'dot';
    strip.style.backgroundImage = '';
    return revision;
  }
  function settle() {
    animation?.cancel();
    animation = null;
    host.dataset.phase = 'done';
    const callback = complete;
    complete = null;
    callback?.();
  }
  async function play(stage, run) {
    if (run !== revision) return;
    const frames = sheets[stage];
    host.dataset.phase = stage;
    strip.style.backgroundImage = `url("${images[stage].src}")`;
    strip.style.height = `${frames * 20}px`;
    animation?.cancel();
    try {
      animation = strip.animate(
        Array.from({length: frames}, (_, frame) => ({transform: `translateY(-${frame * 20}px)`})),
        {duration: frames * frameMs, iterations: 1, easing: `steps(${frames}, jump-none)`, fill: 'forwards'}
      );
      await animation.finished;
    } catch {
      if (run === revision) {
        host.dataset.phase = 'dot';
        animation = null;
        if (complete) settle();
      }
      return;
    }
    if (run !== revision) return;
    if (stage === 'think-out') return settle();
    // Finish the current authored loop before its exit; no arbitrary frame cut.
    play(stage === 'grow' ? 'think-in' : complete ? 'think-out' : 'think-loop', run);
  }
  return {
    start() {
      const run = reset();
      ready.then(() => { if (run === revision) play('grow', run); }, () => {});
    },
    finish(callback) {
      complete = callback;
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
  const thinkingMark = createThinkingMark($('#thinkingMark'));
  const setStatus = createStatusShimmer($('#loadingLabel'), $('#loadingText'));
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
    thinkingMark.start();
    $('#skeletonSlot').replaceChildren();
    setStatus('Organizing content', true);
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
  runSkeleton();
  $('#timelineTrigger').onclick = () => {
    const open = $('#timelineTrigger').getAttribute('aria-expanded') !== 'true';
    $('#timelineTrigger').setAttribute('aria-expanded', String(open));
    $('#timelineBody').classList.toggle('open', open);
    $('#timelineBody').inert = !open;
  };
}
