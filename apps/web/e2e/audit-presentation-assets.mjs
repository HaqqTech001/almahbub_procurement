// Local asset read/decode verification only. Does not contact or mutate a database.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
const root = resolve('apps/web/public');
const files = [
  ...readdirSync(join(root, 'media/international')).filter(f => /^category-/.test(f)).map(f => '/media/international/' + f),
];
function walk(dir) { for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) { const path = dir + '/' + entry.name; if (entry.isDirectory()) walk(path); else files.push('/' + path); } }
walk('media/ie/commodities');
const server = createServer((req, res) => {
  const file = req.url?.split('?')[0];
  if (!files.includes(file)) { res.writeHead(404).end(); return; }
  const bytes = readFileSync(join(root, file));
  res.writeHead(200, { 'Content-Type': { '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp' }[extname(file)], 'Content-Length': bytes.length });
  res.end(bytes);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  for (const path of files) {
    const response = await page.request.get(base + path);
    const decoded = await page.evaluate(async src => { const image = new Image(); image.src = src; try { await image.decode(); return { decoded: true, width: image.naturalWidth, height: image.naturalHeight }; } catch { return { decoded: false }; } }, base + path);
    results.push({ path, status: response.status(), mime: response.headers()['content-type'], ...decoded });
  }
  writeFileSync('docs/presentation-assets-verification.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results));
  if (results.some(r => !r.decoded || r.status !== 200)) process.exitCode = 1;
} finally { await browser?.close(); server.close(); }
