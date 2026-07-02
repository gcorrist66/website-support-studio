import fs from "node:fs";
import path from "node:path";
import { injectWssClientPortal } from "./wss-client-portal-section.mjs";

const roots = [
  "build-queue-2",
  "outreach/queue-2-preview-handoff",
  ".artifacts/wss-prospect-previews-deploy/public",
];

const slugs = [
  "skyview-roofing-experts",
  "hoffman-roofing",
  "rays-roofing-of-central-florida",
  "tr-roofing",
  "fast-track-roofing",
];

const htmlNames = ["preview.html", "index.html"];

let updated = 0;

for (const root of roots) {
  for (const slug of slugs) {
    for (const htmlName of htmlNames) {
      const filePath = path.resolve(root, slug, htmlName);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const current = fs.readFileSync(filePath, "utf8");
      const next = injectWssClientPortal(current);

      if (next !== current) {
        fs.writeFileSync(filePath, next);
        updated += 1;
        console.log(`updated ${path.relative(process.cwd(), filePath)}`);
      }
    }
  }
}

console.log(`WSS client portal section applied to ${updated} preview files.`);
