import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const uiSrc = path.resolve(rootDir, "../../packages/ui/src");

/** Exact `@hamd/ui[/name]` → package source so Fast Refresh keeps a single context identity. */
function hamdUiSourceAliases(): { find: RegExp; replacement: string }[] {
  const aliases: { find: RegExp; replacement: string }[] = [];
  const rootIndex = path.join(uiSrc, "index.ts");
  if (fs.existsSync(rootIndex)) {
    aliases.push({ find: /^@hamd\/ui$/, replacement: rootIndex });
  }
  for (const entry of fs.readdirSync(uiSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexTs = path.join(uiSrc, entry.name, "index.ts");
    const indexTsx = path.join(uiSrc, entry.name, "index.tsx");
    const target = fs.existsSync(indexTs)
      ? indexTs
      : fs.existsSync(indexTsx)
        ? indexTsx
        : null;
    if (!target) continue;
    aliases.push({
      find: new RegExp(`^@hamd\\/ui\\/${entry.name}$`),
      replacement: target,
    });
  }
  return aliases;
}

const gisCompatibleHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      ...hamdUiSourceAliases(),
      {
        find: /^@hamd\/constants$/,
        replacement: path.resolve(rootDir, "../../packages/constants/src/index.ts"),
      },
      { find: "@", replacement: path.resolve(rootDir, "./src") },
    ],
  },
  server: {
    host: true,
    port: 3000,
    headers: gisCompatibleHeaders,
    watch: {
      // Prebuilt dist updates must not create duplicate module graphs under HMR.
      ignored: ["**/packages/*/dist/**"],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
    headers: gisCompatibleHeaders,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("react-dom") || id.includes("/react/")) {
            return "vendor-react";
          }
          if (id.includes("@hamd/ui") || id.includes("/packages/ui/")) {
            return "hamd-ui";
          }
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
