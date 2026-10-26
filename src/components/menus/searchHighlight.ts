export function highlightSearchTarget(row: HTMLElement, title: HTMLElement) {
  function containers() {
    const scrollers: HTMLElement[] = [],
      clipped: HTMLElement[] = [];
    for (let parent = title.parentElement; parent; parent = parent.parentElement) {
      const { overflowY, position } = getComputedStyle(parent);
      const root = parent === document.scrollingElement;
      if (
        (root
          ? overflowY !== 'hidden' && overflowY !== 'clip'
          : overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      )
        scrollers.push(parent);
      else if (overflowY === 'hidden' && !root && parent !== document.body) clipped.push(parent);
      if (position === 'fixed') break;
    }
    return { scrollers, clipped };
  }
  function viewport(scroller: HTMLElement) {
    const top =
      scroller === document.scrollingElement
        ? 0
        : scroller.getBoundingClientRect().top + scroller.clientTop;
    return { top, bottom: top + scroller.clientHeight };
  }
  function center(behavior: ScrollBehavior) {
    if (!title.getClientRects().length) return;
    const { scrollers, clipped } = containers();
    clipped.forEach((element) => {
      element.scrollTop = 0;
    });
    const bounds = title.getBoundingClientRect();
    let middle = (bounds.top + bounds.bottom) / 2;
    for (const scroller of scrollers) {
      const view = viewport(scroller);
      const top = Math.max(
        0,
        Math.min(
          scroller.scrollTop + middle - (view.top + view.bottom) / 2,
          scroller.scrollHeight - scroller.clientHeight
        )
      );
      middle -= top - scroller.scrollTop;
      scroller.scrollTo({ top, behavior });
    }
  }
  center('smooth');
  let stopped = false,
    frame = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined,
    interacted = false;
  const markInteraction = () => {
    interacted = true;
  };
  const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const arm = setTimeout(() => {
    if (!stopped)
      events.forEach((event) =>
        window.addEventListener(event, markInteraction, { once: true, passive: true })
      );
  }, 0);
  function cleanup() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    clearTimeout(arm);
    events.forEach((event) => window.removeEventListener(event, markInteraction));
    title.classList.remove('cui-feature-anchor-highlight');
    row.classList.remove('cui-feature-anchor-row-fill');
    title.removeEventListener('animationend', onEnd);
  }
  function onEnd(event: AnimationEvent) {
    if (
      event.target === title &&
      ['cui-feature-anchor-highlight-underline', 'cui-feature-anchor-highlight-underline-rtl'].includes(
        event.animationName
      )
    )
      cleanup();
  }
  const start = performance.now();
  let previousTop: number | undefined;
  let stableFrames = 0;
  function settle() {
    if (!title.isConnected) return cleanup();
    const { scrollers, clipped } = containers();
    clipped.forEach((element) => {
      element.scrollTop = 0;
    });
    const elapsed = performance.now() - start;
    const { top } = title.getBoundingClientRect();
    stableFrames =
      previousTop !== undefined && Math.abs(top - previousTop) < 0.5 ? stableFrames + 1 : 0;
    previousTop = top;
    if ((elapsed >= 250 && stableFrames >= 3) || elapsed >= 1500) {
      if (!interacted) {
        const bounds = title.getBoundingClientRect();
        const view = scrollers.length ? viewport(scrollers[0]) : { top: 0, bottom: innerHeight };
        if (
          Math.abs((bounds.top + bounds.bottom) / 2 - (view.top + view.bottom) / 2) >
          (view.bottom - view.top) / 4
        )
          center('instant');
      }
      title.classList.add('cui-feature-anchor-highlight');
      row.classList.add('cui-feature-anchor-row-fill');
      title.addEventListener('animationend', onEnd);
      timeout = setTimeout(cleanup, 2050);
    } else frame = requestAnimationFrame(settle);
  }
  frame = requestAnimationFrame(settle);
  return cleanup;
}
