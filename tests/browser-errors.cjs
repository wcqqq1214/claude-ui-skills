// Install before navigation: static pages have no Vite client to forward native
// ErrorEvents, and Playwright pageerror can miss events without an error object.
async function captureNativeBrowserErrors(page, errors) {
  await page.exposeFunction('__cuiReportUnhandledError', message => errors.push(message));
  await page.addInitScript(() => {
    window.addEventListener('error', event => {
      if (event instanceof ErrorEvent) void window.__cuiReportUnhandledError(`window.error: ${event.message}`);
    });
    window.addEventListener('unhandledrejection', event => {
      void window.__cuiReportUnhandledError(`unhandledrejection: ${String(event.reason?.stack ?? event.reason)}`);
    });
  });
}

module.exports = { captureNativeBrowserErrors };
