'use strict';
function initReadingDemo() {
  bindReadingCodeCopy();
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
  $('#bodySize').onchange = (e) => {
    const n = Number(e.target.value);
    document.documentElement.style.setProperty('--reading-body', n + 'px');
    DemoI18n.text($('#measureOutput'), () =>
      DemoI18n.t('Max width {0} px · Line height {1} px', n * 36, Number((n * 1.6).toFixed(1)))
    );
  };
  $('#expandTable').onclick = () => {
    const clone = DemoI18n.clone($('#motionTable'));
    clone.removeAttribute('id');
    $('#expandedTable').replaceChildren(clone);
    $('#tableDialog').showModal();
  };
  $('#closeTable').onclick = () => $('#tableDialog').close();
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
