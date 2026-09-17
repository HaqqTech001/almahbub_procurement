// Local production bundle review. All API/remote traffic is mocked; no hosted writes.
/* global process, URL, document, innerWidth, localStorage, getComputedStyle, fetch, console */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { preview } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const assets = JSON.parse(readFileSync('docs/canonical-presentation-assets.json', 'utf8'));
const output = 'apps/web/commerce-test-results';
mkdirSync(output, { recursive: true });
const server = await preview({ root: resolve('apps/web'), preview: { host: '127.0.0.1', port: 4178, strictPort: true, open: false } });
const base = 'http://127.0.0.1:4178';
const browser = await chromium.launch({ headless: true });
const results = [];
const themeOnly = process.argv.includes('--theme-only');
const failureOnly = process.argv.includes('--failure-only');
const commodities = assets.filter(row => row.business === 'IE').map((row, index) => ({
  id: row.slug, slug: row.slug, name: row.name, published: true, sortOrder: index,
  category: null, shortDescription: null, description: 'API-controlled commodity detail.',
  heroMedia: { src: `https://stale-media.invalid/${row.slug}.jpg`, alt: 'Stale database image' },
  gallery: [], specifications: [], applications: [], packaging: null, qualityInformation: null, markets: null,
}));
try {
  for (const width of themeOnly ? [] : failureOnly ? [768] : [320, 360, 390, 430, 768, 1024, 1440, 1600]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const network = await context.newCDPSession(page);
    await network.send('Network.enable');
    const trace = [];
    network.on('Network.requestWillBeSent', event => {
      if (event.request.url.includes('/media/presentation/')) trace.push({ url: event.request.url, loaderId: event.loaderId, documentURL: event.documentURL, initiator: event.initiator });
    });
    const requests = [];
    let failStatic = false;
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      // Start counts at the document request, excluding late lazy requests from
      // the previous page while reload is being scheduled.
      if (route.request().isNavigationRequest() && url.origin === base) requests.length = 0;
      requests.push(url.pathname);
      if (url.hostname === 'stale-media.invalid') return route.fulfill({ status: 200, contentType: 'image/webp', body: readFileSync('apps/web/public' + assets[0].canonical) });
      if (url.pathname.includes('/api/')) {
        let data = [];
        if (url.pathname.includes('/wedding')) data = { modalEnabled: false };
        if (url.pathname.endsWith('/integrated-export/commodities')) data = commodities;
        const detail = commodities.find(row => url.pathname.endsWith('/commodities/' + row.slug));
        if (detail) data = detail;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
      }
      if (failStatic && url.pathname.startsWith('/media/presentation/v2/')) return route.fulfill({ status: 404, body: 'Not found' });
      if (url.origin !== base) return route.fulfill({ status: 404, body: '' });
      return route.continue();
    });
    for (const path of failureOnly ? [] : ['/', '/about', '/businesses/almahbub-international', '/businesses/almahbub-integrated-export', '/businesses/almahbub-integrated-export/commodities']) {
      requests.length = 0;
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const cookies = page.getByRole('button', { name: 'Essential only' });
      if (await cookies.isVisible()) await cookies.click();
      await page.locator('main .commerce-grid img, .business-logo img, .hamd-aie-commodity-card img').evaluateAll(async images => {
        for (const img of images) { img.loading = 'eager'; await img.decode(); }
      });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${path} overflows at ${width}`);
      assert(!requests.some(url => url.includes('/catalog-media/') || url.endsWith('.jpg') && commodities.some(row => url === `/${row.slug}.jpg`)), 'API image requested');
      const presentationRequests = requests.filter(url => url.startsWith('/media/presentation/v2/'));
      assert.equal(presentationRequests.length, new Set(presentationRequests).size, 'duplicate cover requests');
      if (path === '/') {
        assert.equal(await page.locator('.commerce-grid img').count(), 17);
        assert(!requests.some(url => url.includes('/categories') || url.includes('/commodities')), 'homepage waits for catalogue');
        const actual = await page.locator('.commerce-grid img').evaluateAll(images => images.map(img => new URL(img.currentSrc).pathname));
        assert.deepEqual(actual.sort(), assets.map(row => row.canonical).sort());
      }
      if (path === '/about') {
        assert.equal(await page.getByRole('img', { name: 'Almahbub International logo', exact: true }).getAttribute('src'), '/almahbub.svg');
        assert.equal(await page.getByRole('img', { name: 'Almahbub Integrated Export Ltd. logo', exact: true }).getAttribute('src'), '/media/brands/almahbub-integrated-export.jpg');
      }
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/canonical-${path === '/' ? 'home' : path.split('/').pop()}-${width}.png`, fullPage: true });
      results.push({ path, width, decoded: true, overflow, duplicateCoverRequests: false, apiImageRequests: 0 });
    }
    // Every detail slug must ignore a technically valid but stale HTTP-200 override.
    if (width === 390 || width === 1440) for (const row of commodities) {
      requests.length = 0;
      await page.goto(base + '/businesses/almahbub-integrated-export/commodities/' + row.slug, { waitUntil: 'networkidle' });
      const hero = page.locator('img[data-ie-hero="true"]');
      await hero.evaluate(img => img.decode());
      assert.equal(await hero.getAttribute('src'), assets.find(asset => asset.slug === row.slug).canonical);
      assert.equal(await hero.getAttribute('loading'), 'eager');
      assert(!requests.includes(`/${row.slug}.jpg`));
      results.push({ path: row.slug, width, detailHero: 'canonical', decoded: true });
    }
    // Static 404 has one terminal placeholder, identical geometry, no raw alt text.
    await page.goto(base, { waitUntil: 'networkidle' });
    const geometry = await page.locator('.commerce-grid li').evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
    // Unload the successful document before enabling 404s. Otherwise pending
    // lazy requests from that document can race with the next navigation.
    await page.goto('about:blank');
    failStatic = true; requests.length = 0;
    await page.goto(base, { waitUntil: 'networkidle' });
    for (const card of await page.locator('.commerce-grid li').all()) await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelectorAll('.commerce-grid .presentation-image--placeholder').length === 17);
    assert.equal(await page.locator('.commerce-grid img').count(), 0);
    const failedGeometry = await page.locator('.commerce-grid li').evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
    geometry.forEach((height, index) => assert(Math.abs(height - failedGeometry[index]) < 1, '404 layout shift'));
    const failedRequests = requests.filter(url => url.startsWith('/media/presentation/v2/'));
    writeFileSync(`${output}/canonical-network-trace.json`, JSON.stringify(trace, null, 2));
    assert.equal(new Set(failedRequests).size, 17);
    const currentLoader = trace.at(-1).loaderId;
    const currentTrace = trace.filter(event => event.loaderId === currentLoader);
    // Chromium's trace includes parser-initiated re-requests in some 404 runs,
    // after a script-started request already failed. Verify application
    // attempts independently and require the entire network to settle.
    const scriptAttempts = currentTrace.filter(event => event.initiator.type === 'script').map(event => event.url);
    assert.equal(scriptAttempts.length, new Set(scriptAttempts).size, 'application retried a failed cover');
    for (const url of new Set(failedRequests)) assert(failedRequests.filter(item => item === url).length <= 2, 'unbounded browser retry');
    await page.waitForTimeout(500);
    assert.equal(requests.filter(url => url.startsWith('/media/presentation/v2/')).length, failedRequests.length, '404 requests did not settle');
    const accessibility = await new AxeBuilder({ page }).include('.commerce-grid').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(accessibility.violations.length, 0, JSON.stringify(accessibility.violations));
    results.push({ width, static404: '17 terminal accessible placeholders', stableLayout: true, applicationRetries: 0, parserReRequests: failedRequests.length - 17 });
    await context.close();
  }
  for (const theme of failureOnly ? [] : ['light', 'dark']) for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.addInitScript(value => localStorage.setItem('hamd.web.theme', value), theme);
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname.includes('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { modalEnabled: false } }) });
      if (url.origin !== base) return route.fulfill({ status: 404, body: '' });
      return route.continue();
    });
    for (const path of ['/', '/about']) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      for (const [index, logo] of (await page.locator('main .business-logo').all()).entries()) {
        await logo.locator('img').evaluate(img => img.decode());
        await logo.scrollIntoViewIfNeeded();
        await logo.screenshot({ path: `${output}/logo-${path === '/' ? 'home' : 'about'}-${theme}-${width}-${index}.png` });
        const dimensions = await logo.locator('img').evaluate(img => ({ width: img.width, height: img.height, fit: getComputedStyle(img).objectFit }));
        assert(dimensions.width > 0 && dimensions.height > 0);
        assert.equal(dimensions.fit, 'contain');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const axe = await new AxeBuilder({ page }).include(path === '/' ? 'main .business-logo' : '.about-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations));
      results.push({ path, theme, width, logosDecoded: true, contained: true, accessibility: 'pass' });
    }
    await context.close();
  }
  const delivery = [];
  for (const asset of assets) {
    const response = await fetch(base + asset.canonical);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /image\/webp/);
    delivery.push({ path: asset.canonical, status: response.status, cacheControl: response.headers.get('cache-control'), bytes: (await response.arrayBuffer()).byteLength });
  }
  const report = { environment: 'Local Vite production preview; all API and external requests mocked', results, delivery, productionTimingMeasured: false };
  writeFileSync(`${output}/${themeOnly ? 'canonical-theme-review' : failureOnly ? 'canonical-failure-review' : 'canonical-review'}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: results.length, assets: delivery.length, result: 'PASS', cacheControl: delivery[0].cacheControl }));
} finally { await browser.close(); await new Promise(done => server.httpServer.close(done)); }
