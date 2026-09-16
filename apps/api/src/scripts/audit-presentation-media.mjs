// Read-only database audit. Never writes records or uploads objects.
import { config } from 'dotenv';
import { createDatabaseClient } from '@hamd/database';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import console from 'node:console';
config({ path: 'apps/api/.env', quiet: true });
const db = createDatabaseClient(process.env.DATABASE_URL);
try {
  const categories = await db.productCategory.findMany({ select: { id: true, name: true, slug: true, imageUrl: true, status: true } });
  const commodities = await db.integratedExportCommodity.findMany({ select: { id: true, name: true, slug: true, heroMedia: true, gallery: true, published: true } });
  const local = (src) => {
    const match = /^\/api\/v1\/public\/catalog-media\/(.+)$/.exec(src || '');
    return match ? existsSync(resolve('apps/api', process.env.UPLOAD_ROOT || 'uploads', 'public/catalog', match[1])) : null;
  };
  const report = { checkedAt: new Date().toISOString(), localDriver: process.env.CATALOG_MEDIA_DRIVER || 'local', categories: categories.map(r => ({ ...r, localFileExists: local(r.imageUrl) })), commodities: commodities.map(r => ({ ...r, localFileExists: local(r.heroMedia?.src) })) };
  writeFileSync('docs/presentation-media-records.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error('Read-only media audit could not connect or query:', error.code || error.name);
  process.exitCode = 1;
} finally { await db.$disconnect(); }
