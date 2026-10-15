'use strict';
function initFeedbackDemo() {
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
        clearSkeleton();
        $('#skeletonSlot').replaceChildren(...DemoI18n.clone(loadedTemplate).childNodes);
        DemoI18n.text($('#loadingLabel'), () => DemoI18n.t('Example content is ready'));
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
