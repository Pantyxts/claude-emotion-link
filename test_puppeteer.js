const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

  try {
    // First load the test page for Hiyori
    console.log('=== Loading test.html (Hiyori) ===');
    await page.goto('http://localhost:3456/test.html', {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    // Wait for async operations
    await new Promise(r => setTimeout(r, 2000));

    // Get the test page output
    const testContent = await page.evaluate(() => {
      return document.getElementById('log')?.textContent || 'No log element';
    });
    console.log(testContent);

    // Now load the full viewer
    console.log('\n=== Loading index.html ===');
    logs.length = 0;

    await page.goto('http://localhost:3456/', {
      waitUntil: 'networkidle0',
      timeout: 15000
    }).catch(e => ({ error: e.message }));

    // Wait for model to load and SSE to connect
    await new Promise(r => setTimeout(r, 3000));

    // Log any console output
    if (logs.length > 0) {
      console.log('Console output:');
      logs.forEach(l => console.log(l));
    } else {
      console.log('No console output captured');
    }

    // Check page state
    const pageState = await page.evaluate(() => {
      const loading = document.getElementById('loading');
      const loadingText = loading?.querySelector('.loading-text')?.textContent;
      const loadingSub = loading?.querySelector('.loading-sub')?.textContent;
      const statusLabel = document.getElementById('status-label')?.textContent;
      const emotionName = document.getElementById('emotion-name')?.textContent;
      return {
        loadingVisible: loading && !loading.classList.contains('hidden'),
        loadingText,
        loadingSub,
        statusLabel,
        emotionName,
        canvasExists: !!document.getElementById('live2d-canvas'),
      };
    });
    console.log('Page state:', JSON.stringify(pageState, null, 2));

    // Check if Live2DCubismCore is available
    const coreCheck = await page.evaluate(() => {
      if (typeof Live2DCubismCore !== 'undefined') {
        const C = Live2DCubismCore;
        return {
          found: true,
          version: typeof C.Version,
          moc: typeof C.Moc,
          model: typeof C.Model,
        };
      }
      return { found: false };
    });
    console.log('Core check:', JSON.stringify(coreCheck, null, 2));

    // Test emotion API via page context
    console.log('\n=== Testing emotion push ===');
    await page.evaluate(() => {
      return fetch('/emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion: 'happy' })
      });
    });

    await new Promise(r => setTimeout(r, 1000));

    const afterEmotion = await page.evaluate(() => {
      return {
        emotion: document.getElementById('emotion-name')?.textContent,
        icon: document.getElementById('emotion-icon')?.textContent,
        badgeText: document.getElementById('badge-text')?.textContent,
        badgeIcon: document.getElementById('badge-icon')?.textContent,
        badgeClass: document.getElementById('emotion-badge-top')?.className,
      };
    });
    console.log('After emotion push:', JSON.stringify(afterEmotion, null, 2));

  } catch(err) {
    console.error('Test error:', err.message);
    if (logs.length > 0) {
      console.log('Captured logs:', logs);
    }
  }

  await browser.close();
})();
