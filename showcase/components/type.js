'use strict';
function initTypeDemo() {
  let typeTimers = [];
  const typeScroll = $('#typeScroll'),
    typeReading = $('#typeReading'),
    typeBottom = $('#typeBottom');
  let typePinned = true,
    typeNearEnd = true,
    typeFadeNearEnd = true,
    typeLastTop = 0,
    typeTouchY = null;
  function updateTypeBottom() {
    $('#typeFade').classList.toggle('visible', !typePinned && !typeFadeNearEnd);
    const show = !typePinned && !typeNearEnd;
    typeBottom.classList.toggle('visible', show);
    typeBottom.inert = !show;
    typeBottom.tabIndex = show ? 0 : -1;
    typeBottom.setAttribute('aria-hidden', String(!show));
  }
  function followType() {
    if (typePinned) {
      const bottom = typeScroll.scrollHeight - typeScroll.clientHeight;
      if (bottom - typeScroll.scrollTop > 2) typeScroll.scrollTop = bottom;
      typeLastTop = typeScroll.scrollTop;
    }
    updateTypeBottom();
  }
  function pauseType() {
    typePinned = false;
    updateTypeBottom();
  }
  typeScroll.addEventListener(
    'wheel',
    (e) => {
      if (
        !e.ctrlKey &&
        Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
        e.deltaY < 0 &&
        typeScroll.scrollTop > 0
      )
        pauseType();
    },
    { passive: true }
  );
  typeScroll.addEventListener('keydown', (e) => {
    if (e.target !== typeScroll) return;
    if (['ArrowUp', 'PageUp', 'Home'].includes(e.key) || (e.key === ' ' && e.shiftKey)) pauseType();
  });
  typeScroll.addEventListener(
    'touchstart',
    (e) => {
      typeTouchY = e.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );
  typeScroll.addEventListener(
    'touchmove',
    (e) => {
      const y = e.touches[0]?.clientY;
      if (typeTouchY !== null && y !== undefined && y > typeTouchY && typeScroll.scrollTop > 0)
        pauseType();
      typeTouchY = y ?? null;
    },
    { passive: true }
  );
  typeScroll.addEventListener(
    'scroll',
    () => {
      const top = typeScroll.scrollTop,
        gap = typeScroll.scrollHeight - typeScroll.clientHeight - top;
      if (top < typeLastTop && gap > 2) typePinned = false;
      else if (top > typeLastTop && gap <= 1) typePinned = true;
      typeLastTop = top;
      updateTypeBottom();
    },
    { passive: true }
  );
  new ResizeObserver(followType).observe(typeReading);
  new ResizeObserver(followType).observe(typeScroll);
  new IntersectionObserver(
    (entries) => {
      typeNearEnd = entries[entries.length - 1].isIntersecting;
      updateTypeBottom();
    },
    { root: typeScroll, rootMargin: '0px 0px 200px 0px' }
  ).observe($('#typeEnd'));
  new IntersectionObserver(
    (entries) => {
      typeFadeNearEnd = entries[entries.length - 1].isIntersecting;
      updateTypeBottom();
    },
    { root: typeScroll, rootMargin: '0px 0px 8px 0px' }
  ).observe($('#typeEnd'));
  typeBottom.onclick = () => {
    if (document.activeElement === typeBottom) typeScroll.focus({ preventScroll: true });
    typePinned = true;
    typeScroll.scrollTo({ top: typeScroll.scrollHeight, behavior: 'instant' });
    typeLastTop = typeScroll.scrollTop;
    updateTypeBottom();
  };
  function renderTypeTitle(animate = true) {
    const title = DemoI18n.t('Start with an idea.');
    const chars =
      typeof Intl.Segmenter === 'function'
        ? [...new Intl.Segmenter(DemoI18n.locale, { granularity: 'grapheme' }).segment(title)].map(
            (x) => x.segment
          )
        : Array.from(title);
    $('#revealTitle').replaceChildren(
      ...chars.map((t, i) => {
        const el = document.createElement('span');
        el.className = 'grapheme';
        el.style.setProperty('--i', i);
        if (!animate) el.style.animation = 'none';
        el.textContent = t;
        el.setAttribute('aria-hidden', 'true');
        return el;
      })
    );
  }
  function replayType() {
    typeTimers.forEach(clearTimeout);
    typeTimers = [];
    typePinned = true;
    typeLastTop = 0;
    typeScroll.scrollTop = 0;
    $('#streamParagraphs').replaceChildren();
    updateTypeBottom();
    renderTypeTitle();
    const chunks = [
      'Space makes content ',
      'easier to read. ',
      'Headings appear gently; ',
      'body text stays steady. ',
      'Motion simply signals ',
      'new content.'
    ];
    $('#revealBody').replaceChildren();
    chunks.forEach((s, i) =>
      typeTimers.push(
        setTimeout(
          () => {
            const el = document.createElement('span');
            el.className = 'word-fade';
            DemoI18n.text(el, () => DemoI18n.t(s));
            el.setAttribute('aria-hidden', 'true');
            $('#revealBody').append(el);
            followType();
          },
          320 + i * 155
        )
      )
    );
    const paragraphs = [
      'As content unfolds, your reading position should stay predictable. At the bottom, new paragraphs naturally enter view.',
      'Scroll up to revisit an earlier sentence. New text keeps arriving without pulling you away from what you are reading.',
      'A little space between paragraphs gives each idea a clear boundary and gives your eyes a brief pause.',
      'When you are ready to continue, choose the arrow below. Returning to the bottom lets the view follow new content again.',
      'These fixed paragraphs appear locally to demonstrate how scrolling and reading work together.',
      'While you read, the interface only needs to offer a clear direction. Earlier content stays in place while new paragraphs arrive without competing for attention.',
      'In a narrower space, paragraphs wrap naturally. This scrolling area keeps its own boundary, so the surrounding showcase does not move as the text grows.',
      'The content ends here. You can still browse freely or replay this example.'
    ];
    paragraphs.forEach((text, i) =>
      typeTimers.push(
        setTimeout(
          () => {
            const p = document.createElement('p');
            p.className = 'word-fade';
            DemoI18n.text(p, () => DemoI18n.t(text));
            $('#streamParagraphs').append(p);
            followType();
          },
          1800 + i * 1400
        )
      )
    );
  }
  DemoI18n.onChange(() => renderTypeTitle(false));
  $('#replayType').onclick = replayType;
  replayType();
}
