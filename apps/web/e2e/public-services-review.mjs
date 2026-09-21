// Local production review. Every API and external request is intercepted; no live API is started.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULT_WEDDING_CAMPAIGN, weddingModalDismissKey } from '../../../packages/constants/dist/index.js';

const output = resolve('apps/web/commerce-test-results/public-services');
mkdirSync(output, { recursive: true });
const server = await preview({ root: resolve('apps/web'), preview: { host: '127.0.0.1', port: 4186, strictPort: true, open: false } });
const base = 'http://127.0.0.1:4186';
const browser = await chromium.launch({ headless: true });
const procurement = '/businesses/almahbub-international';
const exporting = '/businesses/almahbub-integrated-export';
const category = { id: 'review-category', slug: 'office-business', name: 'Office devices', description: 'Office equipment sourcing.', imageUrl: '/media/presentation/v2/international/office-business.webp' };
const product = { slug: 'review-office-device', name: 'Office device review fixture', description: 'Local browser fixture, never persisted.', category, brandName: null, manufacturerName: null, images: [{ url: category.imageUrl, altText: 'Office equipment', position: 0 }], videos: [], variants: [] };
const commodity = { id: 'review-sesame', slug: 'sesame-seeds', name: 'Sesame Seeds', published: true, sortOrder: 0, category: null, shortDescription: 'Agricultural supply from Nigeria.', description: 'Local browser fixture, never persisted.', heroMedia: { src: '/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp', alt: 'Sesame seeds' }, gallery: [], specifications: [{ label: 'Grade', value: 'As agreed in quotation' }], applications: [], packaging: null, qualityInformation: null, markets: null };
const routes = ['/', procurement, '/global-procurement/category/office-business', '/products', '/product/review-office-device', exporting, `${exporting}/commodities`, `${exporting}/commodities/sesame-seeds`, `${exporting}/process`, `${exporting}/quality`, `${exporting}/markets`, `${exporting}/about`, `${exporting}/contact`, `${exporting}/request`, '/services', '/about', '/contact'];
const reviewRoutes = process.argv.includes('--interaction-only') ? ['/', procurement, exporting] : routes;
const results = [];
try {
  for (const width of (process.argv.includes('--desktop-only') ? [1440] : [390, 768, 1024, 1440])) for (const theme of (process.argv.includes('--dark-only') ? ['dark'] : ['light', 'dark'])) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ theme, key }) => { localStorage.setItem('hamd.web.theme', theme); sessionStorage.setItem(key, '1'); }, { theme, key: weddingModalDismissKey(DEFAULT_WEDDING_CAMPAIGN.id) });
    const page = await context.newPage();
    let authenticated = false;
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      if (url.pathname.includes('/api/')) {
        let data = [];
        if (authenticated && /\/auth\/(refresh|me)$/.test(url.pathname)) data = { accessToken: 'local-browser-review-token', expiresIn: 3600, user: { id: 'local-review', email: 'review@example.test', firstName: 'Review', lastName: 'Buyer', displayName: 'Review Buyer', locale: 'en', timeZone: null }, organizationId: 'local-review', permissions: [] };
        else if (url.pathname.endsWith('/wedding/campaign')) data = { ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: true };
        else if (url.pathname.endsWith('/categories/office-business')) data = { category, products: [product], limit: 16 };
        else if (url.pathname.endsWith('/categories')) data = [category];
        else if (url.pathname.endsWith('/products/review-office-device')) data = product;
        else if (url.pathname.endsWith('/products')) data = [product];
        else if (url.pathname.endsWith('/integrated-export/commodities/sesame-seeds')) data = commodity;
        else if (url.pathname.endsWith('/integrated-export/commodities')) data = [commodity];
        else if (/\/auth\//.test(url.pathname)) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Local anonymous review' } }) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, page: { page: 1, pageSize: 50, total: Array.isArray(data) ? data.length : 1, hasMore: false } }) });
      }
      if (url.origin !== base) return route.fulfill({ status: 404, body: '' });
      return route.continue();
    });
    for (const path of reviewRoutes) {
      console.log(`Review ${width} ${theme} ${path}`);
      requests.length = 0;
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const cookies = page.getByRole('button', { name: 'Essential only' });
      if (await cookies.isVisible()) await cookies.click();
      await page.locator('main').first().waitFor();
      assert(await page.locator('main').innerText().then(text => text.trim().length > 20), `${path} empty page`);
      assert.equal(await page.locator('header.hamd-header--public').count(), 1, `${path} shared header`);
      const brand = path.startsWith(exporting) ? 'Almahbub Integrated Export Ltd.' : path === procurement || path.startsWith('/global-procurement/') || path.startsWith('/products') || path.startsWith('/product/') ? 'Almahbub International' : 'Almahbub Multi-Commerce';
      assert.equal(await page.locator('.hamd-header__brand').getAttribute('aria-label'), brand);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} ${width} overflow`);
      assert.equal(await page.locator('main').innerText().then(text => text.includes('\u2014')), false, `${path} em dash`);
      if (width >= 1200) {
        const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
        assert.deepEqual(await nav.locator(':scope > a, :scope > div > a').allTextContents(), ['Home', 'Global Procurement', 'Nigerian Export', 'Services', 'About', 'Contact']);
        assert.equal(await nav.getByRole('link', { name: 'Home', exact: true }).getAttribute('href'), '/');
      } else {
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        const drawer = page.getByRole('navigation', { name: 'Mobile navigation' });
        assert.equal(await drawer.getByRole('link', { name: 'Home', exact: true }).getAttribute('href'), '/');
        await drawer.getByRole('button', { name: 'Global Procurement menu' }).click();
        assert(await drawer.getByRole('link', { name: 'Product Categories', exact: true }).isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await drawer.isVisible(), false);
      }
      if (path === procurement || path === exporting) {
        await page.locator('.service-hero__image').evaluate(img => img.decode());
        assert.equal(await page.locator('.service-hero__image').getAttribute('fetchpriority'), 'high');
        const other = path === procurement ? '/media/services/export-' : '/media/services/procurement-';
        assert(!requests.some(url => url.startsWith(other)), 'unrelated service hero loaded');
      }
      if (['/', procurement, exporting].includes(path)) {
        await page.locator('.commerce-grid img').evaluateAll(async images => { for (const img of images) { img.loading = 'eager'; await img.decode(); } });
        await page.screenshot({ path: `${output}/${path === '/' ? 'home' : path === procurement ? 'procurement' : 'export'}-viewport-${width}-${theme}.png` });
        await page.screenshot({ path: `${output}/${path === '/' ? 'home' : path === procurement ? 'procurement' : 'export'}-${width}-${theme}.png`, fullPage: true });
      }
      results.push({ path, width, theme, sharedHeader: true, overflow: false, brand });
    }
    // Explicitly follow Home from both service contexts, not just inspect its href.
    for (const path of [procurement, exporting]) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      if (width < 1200) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const nav = page.getByRole('navigation', { name: width < 1200 ? 'Mobile navigation' : 'Primary', exact: true });
      await nav.getByRole('link', { name: 'Home', exact: true }).click();
      await page.waitForURL(base + '/');
      await page.getByRole('heading', { name: /Commerce Across Borders/ }).waitFor();
    }
    if (width >= 1200) {
      for (const label of ['Global Procurement', 'Nigerian Export', 'Services']) {
        const trigger = page.getByRole('button', { name: `${label} menu`, exact: true });
        const panel = page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('region', { name: label, exact: true });
        await trigger.hover();
        await panel.waitFor();
        await panel.locator('a').first().hover();
        assert(await panel.locator('a').last().evaluate(el => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return hit && el.contains(hit); }), `${label} bottom link is clipped or covered`);
        assert(await panel.isVisible(), `${label} pointer transit`);
        const color = await panel.evaluate(el => getComputedStyle(el).backgroundColor);
        assert.equal(color, theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(17, 39, 53)');
        await page.keyboard.press('Escape');
        assert.equal(await panel.isVisible(), false);
        await trigger.click();
        assert(await panel.isVisible(), `${label} click`);
        await page.mouse.click(30, 450);
        assert.equal(await panel.isVisible(), false, `${label} outside`);
        await trigger.focus();
        await page.keyboard.press('ArrowDown');
        await page.waitForFunction(() => document.activeElement?.matches('.hamd-header__mega-panel a'));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Escape');
        assert(await trigger.evaluate(el => el === document.activeElement));
      }
      await page.getByRole('button', { name: 'Global Procurement menu' }).hover();
      await page.screenshot({ path: `${output}/menu-${theme}.png` });
      await page.keyboard.press('Escape');
    }
    const wedding = page.getByRole('button', { name: "Open Rowdotul HAMD'26 invitation" });
    assert(await wedding.isVisible());
    await wedding.click();
    await page.getByRole('dialog').waitFor();
    if (width === 1440 && theme === 'dark') {
      await page.waitForTimeout(10500); // Promotion refresh must not close an explicitly reopened invitation.
      assert(await page.getByRole('dialog').isVisible());
    }
    await page.screenshot({ path: `${output}/wedding-${width}-${theme}.png` });
    try { await page.getByRole('button', { name: 'Close invitation' }).click({ timeout: 5000 }); }
    catch (error) {
      await page.screenshot({ path: `${output}/wedding-failure-${width}-${theme}.png` });
      console.log(await page.locator('.hamd-wedding-modal').evaluate(el => ({ hidden: el.hidden, open: el.open, html: el.outerHTML.slice(0, 300), rect: el.getBoundingClientRect().toJSON(), style: getComputedStyle(el).display })));
      throw error;
    }
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), weddingModalDismissKey(DEFAULT_WEDDING_CAMPAIGN.id)), '1');
    if (width === 1440 && theme === 'light') {
      // Mock-only session hydration verifies that / remains the main landing.
      authenticated = true;
      await page.evaluate(() => localStorage.setItem('hamd.web.auth.sessionHint', '1'));
      await page.goto(base + exporting, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Review Buyer', exact: true }).waitFor();
      await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Home', exact: true }).click();
      await page.waitForURL(base + '/');
      await page.getByRole('heading', { name: /Commerce Across Borders/ }).waitFor();
      await page.getByRole('button', { name: 'Review Buyer', exact: true }).waitFor();
      await page.goto(base + '/contact', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Global Procurement menu', exact: true }).hover();
      await page.getByRole('link', { name: /Product Categories Explore/ }).click();
      await page.waitForURL(base + procurement + '#categories');
      await page.waitForFunction(() => { const el = document.getElementById('categories'); return el && el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().top < 180; });
      console.log('PASS signed-in Home and cross-page category anchor');
    }
    assert.deepEqual(errors, [], 'browser runtime errors');
    console.log(`PASS ${width} ${theme}: ${reviewRoutes.length} routes, Home navigation, menus and wedding`);
    await context.close();
    writeFileSync(`${output}/${process.argv.includes('--interaction-only') ? 'interaction-results' : process.argv.includes('--desktop-only') ? 'desktop-results' : 'results'}.json`, JSON.stringify(results, null, 2));
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
