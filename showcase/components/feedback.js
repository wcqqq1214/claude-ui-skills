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
function initFeedbackDemo() {
  const thinkingMark = createThinkingMark($('#thinkingMark'));
  thinkingMark.start();
  let skeletonTimers = [];
  let skeletonObserver = null;
  const loadedTemplate = DemoI18n.clone($('#skeletonSlot'));
  function clearSkeleton() {
    skeletonTimers.forEach(clearTimeout);
    skeletonTimers = [];
    skeletonObserver?.disconnect();
    skeletonObserver = null;
  }
  function runSkeleton() {
    clearSkeleton();
    thinkingMark.start();
    $('#skeletonSlot').replaceChildren();
    DemoI18n.text($('#loadingLabel'), () => DemoI18n.t('Organizing content'));
    DemoI18n.text($('#skeletonBtn'), () => DemoI18n.t('Reload'));
    skeletonTimers.push(
      setTimeout(() => {
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
      }, 500)
    );
    skeletonTimers.push(
      setTimeout(() => {
        thinkingMark.finish(() => {
          clearSkeleton();
          $('#skeletonSlot').replaceChildren(...DemoI18n.clone(loadedTemplate).childNodes);
          DemoI18n.text($('#loadingLabel'), () => DemoI18n.t('Example content is ready'));
        });
      }, 2300)
    );
  }
  $('#skeletonBtn').onclick = runSkeleton;
  $('#timelineTrigger').onclick = () => {
    const open = $('#timelineTrigger').getAttribute('aria-expanded') !== 'true';
    $('#timelineTrigger').setAttribute('aria-expanded', String(open));
    $('#timelineBody').classList.toggle('open', open);
    $('#timelineBody').inert = !open;
  };
}
