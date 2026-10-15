'use strict';
function initReadingDemo() {
  bindReadingCodeCopy();
  bindReadingNumberSample();
  // Document layout and table overflow.
  const tableViewport = $('#tableViewport');
  function measureTable() {
    const overflow = tableViewport.scrollWidth > tableViewport.clientWidth + 3;
    $('#expandTable').hidden = !overflow;
    tableViewport.toggleAttribute('data-overflowing', overflow);
  }
  const tableObserver = new ResizeObserver(measureTable);
  tableObserver.observe(tableViewport);
  tableObserver.observe($('#motionTable'));
  function updateReadingMeasure() {
    const n = Number($('#bodySize').value), em = Number($('#readingWidth').value);
    document.documentElement.style.setProperty('--reading-body', n + 'px');
    $('#measureProse').style.setProperty('--reading-measure', em + 'em');
    DemoI18n.text($('#measureOutput'), () =>
      DemoI18n.t('Max width {0} px · Line height {1} px', n * em, Number((n * 1.6).toFixed(1)))
    );
    DemoI18n.attr($('#readingWidth'), 'aria-valuetext', () => DemoI18n.t('{0} em · Maximum {1} px', em, n * em));
  }
  $('#bodySize').onchange = updateReadingMeasure;
  $('#readingWidth').oninput = updateReadingMeasure;
  updateReadingMeasure();
  $('#expandTable').onclick = () => {
    const clone = DemoI18n.clone($('#motionTable'));
    clone.removeAttribute('id');
    $('#expandedTable').replaceChildren(clone);
    $('#tableDialog').showModal();
  };
  $('#closeTable').onclick = () => $('#tableDialog').close();
}

function bindReadingNumberSample() {
  const values = [$('#readingNumberProportional'), $('#readingNumberValue')];
  let frame = 0, timer, visible = false, active = true;
  function stop() {
    clearInterval(timer);
    timer = undefined;
  }
  function sync() {
    stop();
    if (!active || !visible || document.hidden) return;
    // Presentation frames only: fixed format, never elapsed time or usage statistics.
    timer = setInterval(() => {
      frame = (frame + 7) % 6000;
      const text = `00:${String(Math.floor(frame / 100)).padStart(2, '0')}.${String(frame % 100).padStart(2, '0')}`;
      values.forEach(value => { value.textContent = text; });
    }, 50);
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe($('.reading-number-sample'));
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { active = false; stop(); });
  window.addEventListener('pageshow', () => { active = true; sync(); });
}

function bindReadingCodeCopy() {
  const button = $('#readingCodeCopy');
  const status = $('#readingCodeStatus');
  let timer;
  let request = 0;
  function showResult(copied, failed = false) {
    button.replaceChildren(DemoIcons.create(copied ? 'Check' : 'Copy'));
    DemoI18n.text(status, () => DemoI18n.t(copied ? 'Copied' : failed ? 'Copy failed' : ''));
  }
  button.onclick = async () => {
    const current = ++request;
    let copied = false;
    try {
      await navigator.clipboard.writeText($('#readingCodeContent').textContent);
      copied = true;
    } catch {
      // Do not announce success when clipboard access is unavailable or denied.
    }
    if (current !== request || !button.isConnected) return;
    clearTimeout(timer);
    showResult(copied, !copied);
    if (copied) timer = setTimeout(() => showResult(false), 2000);
  };
  window.addEventListener('pagehide', () => {
    ++request;
    clearTimeout(timer);
    showResult(false);
  });
}
