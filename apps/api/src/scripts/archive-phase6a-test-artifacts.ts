/**
 * Archives leftover Phase 6A browser-gate test products and announcements.
 * Does not delete real Almahbub catalogue or campaign rows.
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";

async function main(): Promise<void> {
  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const products = await database.product.updateMany({
    where: {
      OR: [
        { slug: { startsWith: "phase6a-test-bed-" } },
        { slug: { startsWith: "phase6b-media-" } },
        { name: { startsWith: "Phase6A Test Bed " } },
        { name: { startsWith: "Phase6B Media " } },
      ],
      status: { not: "archived" },
    },
    data: { status: "archived" },
  });
  const announcements = await database.announcement.updateMany({
    where: {
      OR: [
        { slug: { startsWith: "phase6a-notice-" } },
        { title: { startsWith: "Phase6A Notice " } },
      ],
      status: { not: "archived" },
    },
    data: { status: "archived" },
  });
  const publicLeft = await database.product.count({
    where: {
      status: "published",
      OR: [
        { slug: { startsWith: "phase6a-test-bed-" } },
        { slug: { startsWith: "phase6b-media-" } },
      ],
    },
  });
  console.info(
    JSON.stringify(
      {
        archivedProducts: products.count,
        archivedAnnouncements: announcements.count,
        publicPhase6aLeft: publicLeft,
        publicPhase6BLeft: publicLeft,
      },
      null,
      2,
    ),
  );
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
