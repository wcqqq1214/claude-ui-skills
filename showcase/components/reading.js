'use strict';
function initReadingDemo() {
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
