import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(new URL("../database/package.json", import.meta.url));
const pg = require("pg");

const env = await readFile(new URL("../database/.env", import.meta.url), "utf8");
const dbUrl = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  .replace(/^"|"$/g, "");
if (!dbUrl) throw new Error("DATABASE_URL missing");

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

const summary = await client.query(`
  select
    count(*)::int as products,
    count(*) filter (where status = 'published')::int as published,
    count(*) filter (where exists (
      select 1 from product_images i where i.product_id = p.id and i.is_primary = true
    ))::int as with_primary,
    count(*) filter (where exists (
      select 1 from product_images i where i.product_id = p.id
    ))::int as with_any_image
  from products p
`);

const byCat = await client.query(`
  select coalesce(c.slug, 'uncategorized') as category,
         count(*)::int as products,
         count(*) filter (where exists (
           select 1 from product_images i where i.product_id = p.id and i.is_primary = true
         ))::int as with_primary
  from products p
  left join product_categories c on c.id = p.category_id
  group by 1
  order by 1
`);

const primaries = await client.query(`
  select p.slug, p.name, i.url, i.is_primary, i.position
  from products p
  join product_images i on i.product_id = p.id
  where i.is_primary = true
  order by p.slug
`);

console.log(
  JSON.stringify(
    { summary: summary.rows[0], byCategory: byCat.rows, primaries: primaries.rows },
    null,
    2,
  ),
);
await client.end();
