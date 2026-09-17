// Catalogue-only snapshot. Database enforces read-only mode; no bootstrap/imports.
import { config } from "dotenv";
import { createDatabaseClient } from "@hamd/database";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import console from "node:console";

config({ path: "apps/api/.env", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = createDatabaseClient(process.env.DATABASE_URL);
try {
  const products = await db.$transaction(async tx => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    return tx.product.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true, name: true, slug: true, status: true, description: true,
        category: { select: { name: true, slug: true } },
        brandId: true, manufacturerId: true,
        images: { select: { id: true, url: true, position: true }, orderBy: [{ position: "asc" }, { id: "asc" }] },
        variants: { select: { name: true, specifications: true } },
      },
    });
  }, { maxWait: 20000, timeout: 60000 });
  await mkdir("database/audits", { recursive: true });
  await writeFile("database/audits/catalogue-snapshot.local.json", JSON.stringify({ capturedAt: new Date().toISOString(), products }, null, 2));
  console.log(`Read-only catalogue snapshot: ${products.length} products. No database changes.`);
} catch (error) {
  const diagnostic = String(error.message ?? "") + String(error.cause?.message ?? "");
  const tags = ["timeout", "certificate", "connect", "permission", "password", "tenant", "ENOTFOUND", "ECONNREFUSED", "transaction", "read.only", "does not exist"].filter(tag => new RegExp(tag, "i").test(diagnostic));
  console.error("Catalogue snapshot failed:", error.code || error.name, error.cause?.code ?? "", tags.join(", "));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
