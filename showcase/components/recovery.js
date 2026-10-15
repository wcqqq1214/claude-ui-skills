'use strict';
function initRecoveryDemo(showToast) {
  let notices = [],
    noticeSerial = 0;
  const notificationStack = $('#notificationStack');
  const noticeResize = new ResizeObserver(() => arrangeNotices());
  function removeNotice(id) {
    const item = notices.find((n) => n.id === id);
    if (!item || item.ending) return;
    clearTimeout(item.timer);
    const focused = item.el.contains(document.activeElement);
    item.ending = true;
    item.el.setAttribute('data-ending-style', '');
    item.el.inert = true;
    item.el.setAttribute('aria-hidden', 'true');
    arrangeNotices();
    if (focused)
      (notices.find((n) => !n.ending)?.el.querySelector('button') || $('#addNotification')).focus({
        preventScroll: true
      });
    void item.el.offsetHeight;
    // A new stack position can replace the exit transform while opacity is fading.
    async function finishExit() {
      let animations;
      while ((animations = item.el.getAnimations()).length)
        await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
      noticeResize.unobserve(item.message);
      item.el.remove();
      notices = notices.filter((n) => n !== item);
      arrangeNotices();
    }
    void finishExit();
  }
  function arrangeNotices() {
    const front = notices.find((n) => !n.ending);
    let height;
    if (front) {
      front.content.style.height = '';
      height = front.el.offsetHeight;
      notificationStack.style.height = height + 'px';
    } else if (!notices.length) notificationStack.style.height = '0px';
    let visibleIndex = 0;
    notices.forEach((n, i) => {
      const index = n.ending ? i : visibleIndex++;
      n.el.style.setProperty('--toast-index', index);
      n.el.style.zIndex = String(notices.length - i);
      if (n.ending) return;
      n.content.style.height = index > 0 && height ? height + 'px' : '';
      n.el.classList.toggle('behind', index > 0);
      n.el.toggleAttribute('data-limited', index >= 3);
      n.el.inert = index > 0;
      n.el.setAttribute('aria-hidden', String(index > 0));
    });
    $('#notificationEmpty').hidden = notices.length > 0;
  }
  function addNotice(action = false, repeat = false) {
    let n = repeat ? notices.find((x) => !x.ending && x.key === 'repeat') : null;
    const focused = notices.find((x) => !x.ending && x.el.contains(document.activeElement));
    if (n) {
      n.count++;
      DemoI18n.text(n.text, () => DemoI18n.t('Design notes saved (×{0})', n.count));
      n.el.setAttribute('aria-live', n.count > 2 ? 'off' : 'polite');
      if (!focused) {
        notices = notices.filter((x) => x !== n);
        notices.unshift(n);
      }
      clearTimeout(n.timer);
      n.timer = setTimeout(() => removeNotice(n.id), 6000);
      arrangeNotices();
      return;
    }
    const el = document.createElement('div');
    el.className = 'stack-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('data-starting-style', '');
    const content = document.createElement('div');
    content.className = 'stack-toast-content';
    el.append(content);
    const icon = document.createElement('span');
    icon.className = 'toast-info';
    icon.setAttribute('aria-hidden', 'true');
    icon.append(DemoIcons.create('Info', 20));
    content.append(icon);
    const message = document.createElement('div');
    message.className = 'toast-message';
    content.append(message);
    const p = document.createElement('p');
    DemoI18n.text(p, () =>
      action ? DemoI18n.t('Design notes are ready') : DemoI18n.t('Design notes saved')
    );
    message.append(p);
    const id = ++noticeSerial;
    n = { id, key: repeat ? 'repeat' : null, count: 1, el, content, message, text: p, timer: null };
    if (action) {
      const b = document.createElement('button');
      b.className = 'toast-action';
      DemoI18n.text(b, () => DemoI18n.t('View'));
      b.onclick = () => {
        showToast(() => DemoI18n.t('Local notes: reading rhythm, spatial continuity and state feedback.'));
        removeNotice(id);
      };
      const actions = document.createElement('div');
      actions.className = 'toast-actions';
      actions.append(b);
      message.append(actions);
    }
    const close = document.createElement('button');
    close.className = 'toast-dismiss';
    close.append(DemoIcons.create('X'));
    DemoI18n.attr(close, 'aria-label', () => DemoI18n.t('Dismiss this notice'));
    close.onclick = () => removeNotice(id);
    content.append(close);
    notificationStack.append(el);
    noticeResize.observe(message);
    if (focused) notices.push(n);
    else notices.unshift(n);
    if (!action) n.timer = setTimeout(() => removeNotice(id), 6000);
    arrangeNotices();
    void el.offsetHeight;
    el.removeAttribute('data-starting-style');
  }
  $('#addNotification').onclick = () => {
    for (let i = 0; i < 3; i++) addNotice();
  };
  $('#clearNotifications').onclick = () => {
    for (const notice of notices.filter((item) => !item.ending)) removeNotice(notice.id);
  };
  $('#repeatNotification').onclick = () => addNotice(false, true);
  $('#actionNotification').onclick = () => addNotice(true);
  // A persistent action notice keeps the initial preview visible until dismissed.
  addNotice(true);
}
