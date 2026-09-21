import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["prisma/seed/**/*.test.ts", "pool-errors.test.ts", "pool-lifecycle.test.ts"],
  },
});
