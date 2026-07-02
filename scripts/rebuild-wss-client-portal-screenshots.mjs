import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const targets = [
  {
    root: ".artifacts/wss-prospect-previews-deploy/public",
    htmlName: "index.html",
  },
  {
    root: "build-queue-2",
    htmlName: "preview.html",
  },
  {
    root: "outreach/queue-2-preview-handoff",
    htmlName: "preview.html",
  },
];

const slugs = [
  "skyview-roofing-experts",
  "hoffman-roofing",
  "rays-roofing-of-central-florida",
  "tr-roofing",
  "fast-track-roofing",
];

const browser = await chromium.launch();

try {
  for (const target of targets) {
    for (const slug of slugs) {
      const folder = path.resolve(target.root, slug);
      const htmlPath = path.join(folder, target.htmlName);

      if (!fs.existsSync(htmlPath)) {
        continue;
      }

      const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(folder, "preview-desktop.png"), fullPage: false });
      await page.screenshot({ path: path.join(folder, "preview-full-page.png"), fullPage: true });
      await page.close();

      const mobile = await browser.newPage({
        viewport: { width: 390, height: 1200 },
        deviceScaleFactor: 1,
        isMobile: true,
      });
      await mobile.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await mobile.screenshot({ path: path.join(folder, "preview-mobile.png"), fullPage: true });
      await mobile.close();

      console.log(`rebuilt screenshots for ${path.relative(process.cwd(), folder)}`);
    }
  }
} finally {
  await browser.close();
}
