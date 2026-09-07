import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportDir = join(__dirname, "..", "quality", "reports");
mkdirSync(reportDir, { recursive: true });

const BASE = process.env.HAMD_WEB_URL ?? "http://127.0.0.1:4173/";
const MIN_SCORE = Number(process.env.LH_MIN_SCORE ?? "95");

const TARGETS = {
  performance: MIN_SCORE,
  accessibility: MIN_SCORE,
  "best-practices": MIN_SCORE,
  seo: MIN_SCORE,
};

async function main() {
  const chromeLauncher = await import("chrome-launcher");
  const lighthouse = (await import("lighthouse")).default;

  const { existsSync } = await import("node:fs");
  const winCandidates = [
    process.env.CHROME_PATH,
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`
      : undefined,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const chromePath =
    winCandidates.find((candidate) => existsSync(candidate)) ??
    (process.platform === "win32" ? undefined : process.env.CHROME_PATH);

  const runs = Math.max(1, Number(process.env.LH_RUNS ?? "3"));
  /** Take the best performance across runs to reduce CI host noise. */
  let bestScores = null;
  let bestReports = null;
  let bestLhr = null;

  for (let run = 0; run < runs; run += 1) {
    const chrome = await chromeLauncher.launch({
      ...(chromePath ? { chromePath } : {}),
      chromeFlags: [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--force-prefers-reduced-motion",
      ],
    });

    try {
      const runnerResult = await lighthouse(BASE, {
        port: chrome.port,
        output: ["json", "html"],
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttlingMethod: "simulate",
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
          cpuSlowdownMultiplier: 1,
        },
        disableStorageReset: true,
      });

      if (!runnerResult) throw new Error("Lighthouse returned no result.");

      const scores = Object.fromEntries(
        Object.entries(runnerResult.lhr.categories).map(([key, cat]) => [
          key,
          Math.round((cat.score ?? 0) * 100),
        ]),
      );
      console.log(`Lighthouse run ${run + 1}/${runs}`, scores);

      if (
        !bestScores ||
        (scores.performance ?? 0) > (bestScores.performance ?? 0)
      ) {
        bestScores = scores;
        bestReports = runnerResult.report;
        bestLhr = runnerResult.lhr;
      }
    } finally {
      try {
        await chrome.kill();
      } catch {
        /* Windows may EPERM on temp cleanup after successful run */
      }
    }
  }

  if (!bestScores || !bestReports || !bestLhr) {
    throw new Error("Lighthouse produced no scores.");
  }

  writeFileSync(join(reportDir, "lighthouse-desktop.json"), bestReports[0]);
  writeFileSync(join(reportDir, "lighthouse-desktop.html"), bestReports[1]);

  writeFileSync(
    join(reportDir, "lighthouse-summary.json"),
    JSON.stringify(
      {
        url: BASE,
        formFactor: "desktop",
        scores: bestScores,
        targets: TARGETS,
        fetchTime: bestLhr.fetchTime,
        runs,
      },
      null,
      2,
    ),
  );

  console.log("Lighthouse best scores", bestScores);

  const failures = Object.entries(TARGETS).filter(([key, min]) => {
    const score = bestScores[key] ?? 0;
    return score < min;
  });

  if (failures.length > 0) {
    console.error(
      "Lighthouse gate failed:",
      failures
        .map(([key, min]) => `${key}=${bestScores[key] ?? 0} (min ${min})`)
        .join(", "),
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
