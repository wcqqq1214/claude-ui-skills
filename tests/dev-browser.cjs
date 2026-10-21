const { resolve } = require('node:path');

// Only ordinary development suites share this lifetime. Each suite still owns
// its pages, contexts, clocks and browser error assertions.
async function withDevBrowser(run) {
  const { createServer } = await import('vite');
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
  const server = await createServer({ root: resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0, open: false } });
  let browser, result;
  const errors = [];
  try {
    await server.listen();
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    result = await run({ browser, base: `http://127.0.0.1:${server.httpServer.address().port}` });
  } catch (error) { errors.push(error); }
  // Always release both resources, including a failed listen/launch, while
  // preserving the first failure so a cleanup error cannot hide the test result.
  for (const resource of [browser, server]) {
    try { await resource?.close(); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw errors[0];
  return result;
}

module.exports = { withDevBrowser };
