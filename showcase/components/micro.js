'use strict';
function initMicroDemo() {
  const tip = $('#demoTooltip'),
    tipTarget = $('#tipTarget');
  let tipTimer = null;
  function showTip() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => {
      tip.classList.add('visible');
      tipTarget.setAttribute('aria-describedby', 'demoTooltip');
    }, 300);
  }
  function hideTip() {
    clearTimeout(tipTimer);
    tip.classList.remove('visible');
    tipTarget.removeAttribute('aria-describedby');
  }
  tipTarget.onpointerenter = showTip;
  tipTarget.onpointerleave = hideTip;
  tipTarget.onfocus = showTip;
  tipTarget.onblur = hideTip;
  tipTarget.onkeydown = (e) => {
    if (e.key === 'Escape') hideTip();
  };
  let copyTimer;
  $('#copyBtn').onclick = async () => {
    try {
      const text = $('#copyText').textContent;
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const t = document.createElement('textarea');
        t.value = text;
        t.style.position = 'fixed';
        t.style.left = '-9999px';
        document.body.append(t);
        t.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } finally {
          t.remove();
          $('#copyBtn').focus();
        }
        if (!ok) throw new Error('clipboard unavailable');
      }
      clearTimeout(copyTimer);
      DemoI18n.text($('#copyBtn'), () => DemoI18n.t('✓ Copied'));
      copyTimer = setTimeout(() => DemoI18n.text($('#copyBtn'), () => DemoI18n.t('Copy')), 2000);
    } catch {
      DemoI18n.text($('#copyBtn'), () => DemoI18n.t('Copy failed'));
      showToast(() => DemoI18n.t('The browser did not allow copying. You can select the text manually.'));
    }
  };
  let toastTimer,
    toastRevision = 0;
  const microToast = $('#toast');
  function showToast(render) {
    clearTimeout(toastTimer);
    ++toastRevision;
    const starting = microToast.hidden;
    microToast.hidden = false;
    microToast.inert = false;
    microToast.removeAttribute('aria-hidden');
    microToast.removeAttribute('data-ending-style');
    DemoI18n.text($('#toastText'), render);
    if (starting) {
      microToast.setAttribute('data-starting-style', '');
      void microToast.offsetHeight;
      microToast.removeAttribute('data-starting-style');
    }
    toastTimer = setTimeout(hideToast, 6000);
  }
  async function hideToast() {
    clearTimeout(toastTimer);
    if (microToast.hidden) return;
    const revision = ++toastRevision;
    if (microToast.contains(document.activeElement)) $('#toastBtn').focus({ preventScroll: true });
    microToast.inert = true;
    microToast.setAttribute('aria-hidden', 'true');
    microToast.setAttribute('data-ending-style', '');
    void microToast.offsetHeight;
    await Promise.all(
      microToast.getAnimations().map((animation) => animation.finished.catch(() => {}))
    );
    if (revision === toastRevision) microToast.hidden = true;
  }
  $('#toastBtn').onclick = () => showToast(() => DemoI18n.t('This notice closes after 6 seconds.'));
  $('#closeToast').onclick = hideToast;
  // Overflow-only tooltip. Range handles text that exceeds the border by subpixels.
  const overflowTarget = $('#overflowTarget'),
    overflowTip = $('#overflowTip');
  let overflowTimer;
  overflowTip.hidden = false;
  function isTruncated() {
    const r = document.createRange();
    r.selectNodeContents(overflowTarget);
    const textRect = r.getBoundingClientRect(),
      box = overflowTarget.getBoundingClientRect();
    return (
      overflowTarget.scrollWidth > overflowTarget.clientWidth ||
      textRect.right > box.right + 0.1 ||
      textRect.left < box.left - 0.1
    );
  }
  function hideOverflowTip() {
    clearTimeout(overflowTimer);
    overflowTip.classList.remove('visible');
    overflowTarget.removeAttribute('aria-describedby');
  }
  function showOverflowTip() {
    hideOverflowTip();
    if (isTruncated())
      overflowTimer = setTimeout(() => {
        overflowTip.classList.add('visible');
        overflowTarget.setAttribute('aria-describedby', 'overflowTip');
      }, 300);
  }
  function measureOverflow() {
    hideOverflowTip();
    DemoI18n.text($('#overflowState'), () =>
      isTruncated() ? DemoI18n.t('Truncated · Hover or focus to read in full') : DemoI18n.t('Not truncated · No hint needed')
    );
  }
  $('#overflowWidth').oninput = (e) => {
    $('.overflow-anchor').style.width = e.target.value + 'px';
    $('#overflowWidthOutput').textContent = e.target.value + ' px';
    measureOverflow();
  };
  overflowTarget.onpointerenter = showOverflowTip;
  overflowTarget.onfocus = showOverflowTip;
  overflowTarget.onpointerleave = hideOverflowTip;
  overflowTarget.onblur = hideOverflowTip;
  overflowTarget.onkeydown = (e) => {
    if (e.key === 'Escape') hideOverflowTip();
  };
  new ResizeObserver(measureOverflow).observe(overflowTarget);
  DemoI18n.onChange(measureOverflow);
  document.fonts?.ready.then(measureOverflow);
  return showToast;
}
