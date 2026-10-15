'use strict';
function initTypeDemo() {
  bindTypeEffectCards();
  let typeTimers = [];
  const typeScroll = $('#typeScroll'),
    typeReading = $('#typeReading'),
    typeBottom = $('#typeBottom');
  const typeMark = typeBottom.querySelector('.type-working-strip');
  let typePlaying = false, typeMarkReady = false, typeMarkAnimation = null;
  // Default activity loop: 40 frames of 48px displayed in a 20px slot.
  typeMark.decode().then(() => {
    typeMarkReady = typeof typeMark.animate === 'function';
    updateTypeBottom();
  }, () => {}); // Keep the arrow if the local artwork cannot load.
  let typeIntro = false;
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
    typeBottom.classList.toggle('working', typePlaying && typeMarkReady);
    if (show && typePlaying && typeMarkReady) {
      if (!typeMarkAnimation) {
        typeMarkAnimation = animateTypeWorkingMark(typeMark);
      } else typeMarkAnimation.play();
    } else typeMarkAnimation?.pause();
  }
  function followType() {
    if (typePinned && !typeIntro) {
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
  function stopTypePlayback() {
    typeTimers.forEach(clearTimeout);
    typeTimers = [];
    typeMarkAnimation?.cancel();
    typeMarkAnimation = null;
    typePlaying = false;
    typeIntro = false;
    updateTypeBottom();
  }
  function replayType() {
    stopTypePlayback();
    typePlaying = true;
    typeIntro = true;
    typePinned = true;
    typeLastTop = 0;
    typeScroll.scrollTop = 0;
    $('#streamParagraphs').replaceChildren();
    updateTypeBottom();
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
    function appendParagraph(text, i) {
      typeIntro = false;
      const p = document.createElement('p');
      p.className = 'word-fade';
      DemoI18n.text(p, () => DemoI18n.t(text));
      $('#streamParagraphs').append(p);
      if (i === paragraphs.length - 1) typePlaying = false;
    }
    // Establish overflow quickly, then leave time to explore pause and return.
    paragraphs.forEach((text, i) => {
      typeTimers.push(setTimeout(() => {
        appendParagraph(text, i);
        followType();
      }, i < 3 ? 400 + i * 700 : 1800 + (i - 2) * 2000));
    });
    followType();
  }
  $('#replayType').onclick = replayType;
  // Chapter activation owns sample playback; hidden examples must not finish offscreen.
  const chapter = $('#type');
  let scrollVisible = false;
  const syncPlayback = () => {
    if (chapter.hasAttribute('data-active') && scrollVisible) replayType();
    else stopTypePlayback();
  };
  new MutationObserver(syncPlayback).observe(chapter, {
    attributes: true, attributeFilter: ['data-active']
  });
  new IntersectionObserver(([entry]) => {
    const next = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    if (scrollVisible === next) return;
    scrollVisible = next;
    syncPlayback();
  }, {threshold: 0.25}).observe(typeScroll);
  syncPlayback();
}

// Both presentations use the same authored sheet and frame timing.
function animateTypeWorkingMark(strip) {
  return strip.animate(
    Array.from({length: 40}, (_, frame) => ({transform: `translateY(-${frame * 20}px)`})),
    {duration: 40 * 33.3333, iterations: Infinity, easing: 'steps(40, jump-none)'}
  );
}

function bindTypeEffectCards() {
  let bodyTimers = [], workingAnimation, workingReady = false;
  const visible = new Set();
  const workingButton = $('#workingPreview');
  const strip = workingButton.querySelector('.type-working-strip');
  function renderTypeTitle(animate = true) {
    const title = DemoI18n.t('Start with an idea, then watch each letter come into focus, one after another.');
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
  function stopBody() {
    bodyTimers.forEach(clearTimeout);
    bodyTimers = [];
  }
  function replayBody() {
    stopBody();
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
      bodyTimers.push(
        setTimeout(
          () => {
            const el = document.createElement('span');
            el.className = 'word-fade';
            DemoI18n.text(el, () => DemoI18n.t(s));
            el.setAttribute('aria-hidden', 'true');
            $('#revealBody').append(el);
          },
          320 + i * 155
        )
      )
    );
  }
  function syncWorking() {
    const playing = workingReady && visible.has($('#workingExample')) && !document.hidden;
    workingButton.classList.toggle('working', workingReady);
    if (playing) {
      if (!workingAnimation) workingAnimation = animateTypeWorkingMark(strip);
      else workingAnimation.play();
    } else workingAnimation?.pause();
  }
  strip.decode().then(() => {
    workingReady = typeof strip.animate === 'function';
    syncWorking();
  }, () => {});
  $('#replayGrapheme').onclick = () => renderTypeTitle();
  $('#replayBodyFade').onclick = replayBody;
  DemoI18n.onChange(() => renderTypeTitle(false));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        if (entry.target === $('#graphemeExample')) renderTypeTitle();
        if (entry.target === $('#bodyFadeExample')) replayBody();
      } else {
        visible.delete(entry.target);
        if (entry.target === $('#bodyFadeExample')) stopBody();
      }
    }
    syncWorking();
  });
  ['#graphemeExample', '#bodyFadeExample', '#workingExample'].forEach(id => observer.observe($(id)));
  document.addEventListener('visibilitychange', syncWorking);
  window.addEventListener('pagehide', () => {
    stopBody();
    workingAnimation?.cancel();
    workingAnimation = null;
  });
  window.addEventListener('pageshow', syncWorking);
}
