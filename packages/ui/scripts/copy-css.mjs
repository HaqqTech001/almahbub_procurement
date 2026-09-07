import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = join(root, "dist", "styles");
mkdirSync(targetDir, { recursive: true });

for (const file of [
  "layouts.css",
  "foundation.css",
  "campaign-banner.css",
  "homepage-excellence.css",
  "homepage-sections.css",
  "global-header.css",
  "global-footer.css",
  "newsletter-capture.css",
  "hero-visual-system.css",
  "procurement-timeline.css",
  "homepage-critical.css",
  "auth.css",
  "dashboard.css",
  "catalog.css",
  "product-detail.css",
  "notifications.css",
  "chat.css",
  "identity.css",
  "suppliers.css",
  "procurement.css",
  "quotations.css",
  "purchase-orders.css",
  "shipments.css",
  "assistant.css",
  "cms.css",
  "analytics.css",
  "audit.css",
  "platform-config.css",
  "email-center.css",
  "recommendations.css",
  "enterprise-performance.css",
  "guidance.css",
  "module-layout.css",
  "wedding-campaign.css",
]) {
  const source = join(root, "src", "styles", file);
  if (statSync(source).size === 0) {
    continue;
  }
  copyFileSync(source, join(targetDir, file));
}

console.log("Copied UI styles to dist/styles");
