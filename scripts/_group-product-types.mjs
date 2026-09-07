import { readFile } from "node:fs/promises";

const raw = JSON.parse(await readFile("catalogue-package/expanded-catalogue.json", "utf8"));
const groups = new Map();
for (const product of raw.products) {
  const words = product.name.replace(/[–—-]/g, " ").split(/\s+/).filter(Boolean);
  const key = words.slice(-2).join(" ").toLowerCase();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(product.name);
}
const rows = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [key, names] of rows) {
  console.log(`${String(names.length).padStart(3)}  ${key}  ::  ${names.slice(0, 6).join(" | ")}`);
}
