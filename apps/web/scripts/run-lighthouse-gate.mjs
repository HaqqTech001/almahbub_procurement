/**
 * Starts API stub + vite preview, runs Lighthouse gate, then exits.
 * Windows-safe: no shell concatenation of paths with spaces.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.LOCALAPPDATA
    ? join(
        process.env.LOCALAPPDATA,
        "ms-playwright",
        "chromium-1234",
        "chrome-win64",
        "chrome.exe",
      )
    : undefined,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter((p): p is string => Boolean(p));

async function waitForUrl(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 404 || res.status === 401) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startNode(scriptPath, env = {}) {
  return spawn(process.execPath, [scriptPath], {
    cwd: webRoot,
    env: { ...process.env, ...env },
    stdio: "inherit",
    windowsHide: true,
  });
}

function startPnpm(args, env = {}) {
  // Prefer `pnpm.cmd` via npm_execpath / PATH without shell:true
  const pnpmBin =
    process.env.npm_execpath && existsSync(process.env.npm_execpath)
      ? process.execPath
      : null;

  if (pnpmBin && process.env.npm_execpath) {
    return spawn(process.execPath, [process.env.npm_execpath, ...args], {
      cwd: webRoot,
      env: { ...process.env, ...env },
      stdio: "inherit",
      windowsHide: true,
    });
  }

  return spawn("corepack", ["pnpm", ...args], {
    cwd: webRoot,
    env: { ...process.env, ...env },
    stdio: "inherit",
    windowsHide: true,
    shell: false,
  });
}

async function main() {
  const children = [];
  const shutdown = () => {
    for (const child of children) {
      try {
        if (process.platform === "win32" && child.pid) {
          spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true,
          });
        } else {
          child.kill("SIGTERM");
        }
      } catch {
        /* ignore */
      }
    }
  };
  process.on("exit", shutdown);
  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });

  const stub = startNode(join(__dirname, "lh-api-stub.mjs"));
  children.push(stub);

  const preview = startPnpm([
    "exec",
    "vite",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ]);
  children.push(preview);

  try {
    await waitForUrl("http://127.0.0.1:14000/health");
    await waitForUrl("http://127.0.0.1:4173/");

    const chromePath = chromeCandidates.find((p) => existsSync(p));
    await new Promise((resolve, reject) => {
      const lh = startNode(join(__dirname, "homepage-lighthouse.mjs"), {
        HAMD_WEB_URL: "http://127.0.0.1:4173/",
        LH_API_STUB_PORT: "14000",
        ...(chromePath ? { CHROME_PATH: chromePath } : {}),
      });
      children.push(lh);
      lh.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Lighthouse exited ${code ?? "null"}`));
      });
      lh.on("error", reject);
    });
  } finally {
    shutdown();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
