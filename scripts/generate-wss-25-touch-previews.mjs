import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("outreach/wss-25-touch-preview-assembly");

const prospects = [
  {
    name: "ERIC'S PLUMBING, INC.",
    slug: "erics-plumbing",
    city: "Central Florida",
    phone: "(863) 967-4812",
    license: "CFC1428834",
    vertical: "plumbing",
    headline: "Plumbing Service in Central Florida",
    angle: "A maintained plumbing page gives callers one clear place to verify the license, understand the service area, and call directly.",
  },
  {
    name: "EHRMAN SYSTEMS ENTERPRISES INC DBA ENVIRONMENTAL CONTRACTORS",
    slug: "environmental-contractors",
    city: "Dade City",
    phone: "(352) 567-5515",
    license: "ER0013583",
    vertical: "electrical",
    headline: "Licensed Dade City Electrical Service",
    angle: "A clearer maintained service page helps callers understand the trade, verify the license, and call directly.",
  },
  {
    name: "SIMPSON ENVIRONMENTAL SERVICES, LLC",
    slug: "simpson-environmental-services",
    city: "Dade City",
    phone: "(813) 714-4737",
    license: "CMC1249368",
    vertical: "hvac",
    headline: "AC & Heating in Dade City",
    angle: "A clearer mechanical service page gives callers one obvious place to verify the license and call for service.",
  },
  {
    name: "ALAN'S AIR CONDITIONING SERVICE INC",
    slug: "alans-air-conditioning-service",
    city: "Plant City",
    phone: "(813) 601-2671",
    license: "CAC1815368",
    vertical: "hvac",
    headline: "AC & Heating in Plant City",
    angle: "A clean HVAC page gives an owner-operated service business a maintained place for license trust, services, service area, and phone-first contact.",
  },
  {
    name: "PATTON CONSTRUCTION SERVICES LLC",
    slug: "patton-construction-services",
    city: "Dade City",
    phone: "(813) 917-6073",
    license: "CCC1330063",
    vertical: "roofing",
    headline: "Licensed Roofing in Dade City",
    angle: "A simple roofing page turns the active license and phone number into a cleaner trust-and-call path.",
  },
  {
    name: "S&B ROOFING LLC",
    slug: "sb-roofing",
    city: "Dade City",
    phone: "(352) 467-2001",
    license: "CCC1330893",
    vertical: "roofing",
    headline: "Licensed Roofing in Dade City",
    angle: "A maintained roofing page gives local homeowners a direct phone-first route instead of scattered public mentions.",
  },
  {
    name: "USA ROOFING & MORE LLC",
    slug: "usa-roofing-and-more",
    city: "Dade City",
    phone: "(917) 533-1317",
    license: "CCC1336033",
    vertical: "roofing",
    headline: "Licensed Roofing in Dade City",
    angle: "A focused local roofing page makes the service area, license, and call button visible immediately.",
  },
  {
    name: "WINDSOR GATE CONSTRUCTION SERVICES, LLC.",
    slug: "windsor-gate-construction-services",
    city: "Dade City",
    phone: "(727) 505-4171",
    license: "CCC1336724",
    vertical: "roofing",
    headline: "Licensed Roofing in Dade City",
    angle: "A concise roofing/construction page converts active company and license status into a direct call path.",
  },
  {
    name: "FROST & FLUSH BROTHERS INC",
    slug: "frost-and-flush-brothers",
    city: "Dade City",
    phone: "(863) 333-2485",
    license: "CAC1823691",
    vertical: "hvac",
    headline: "AC & Heating in Dade City",
    angle: "A maintained HVAC page gives callers a stable owned page using the public phone signal and visible license.",
  },
  {
    name: "MARCUS AIR CONDITIONING INC",
    slug: "marcus-air-conditioning",
    city: "Bartow",
    phone: "(863) 581-4675",
    license: "CAC1813352",
    vertical: "hvac",
    headline: "AC & Heating in Bartow",
    angle: "A maintained HVAC page makes the phone number, license, and service area easy to trust at a glance.",
  },
  {
    name: "PROFLO HEATING & COOLING L.L.C.",
    slug: "proflo-heating-and-cooling",
    city: "Bartow",
    phone: "(863) 307-2789",
    license: "CAC1824902",
    vertical: "hvac",
    headline: "AC & Heating in Bartow",
    angle: "A clean HVAC page gives callers a fast way to confirm the license and request service.",
  },
  {
    name: "STORM READY ROOFING & CONSTRUCTION LLC",
    slug: "storm-ready-roofing-and-construction",
    city: "Bartow",
    phone: "(863) 257-8740",
    license: "CCC1335992",
    vertical: "roofing",
    headline: "Licensed Roofing in Bartow",
    angle: "A stronger owned page can replace the thin template feel with license-forward roofing trust and a direct call button.",
  },
  {
    name: "TRUE ROOFERS, LLC",
    slug: "true-roofers",
    city: "Bartow",
    phone: "(863) 581-9556",
    license: "CCC1332725",
    vertical: "roofing",
    headline: "Licensed Roofing in Bartow",
    angle: "A simple roofing page keeps the license and phone-first CTA in front of local homeowners.",
  },
  {
    name: "AIR CONDITIONING HEATING & SERVICE OF TAMPA BAY",
    slug: "air-conditioning-heating-service-of-tampa-bay",
    city: "Clearwater",
    phone: "(727) 422-5444",
    license: "CAC1817210",
    vertical: "hvac",
    headline: "AC & Heating in Clearwater",
    angle: "A focused HVAC trust page keeps the service, license, and phone-first call path above the fold.",
  },
  {
    name: "BRAVOTAMPA, LLC",
    slug: "bravotampa",
    city: "Zephyrhills",
    phone: "(313) 475-0829",
    license: "CAC1822955",
    vertical: "hvac",
    headline: "AC & Heating in Zephyrhills",
    angle: "A direct HVAC page clarifies the service, city, license, and phone number without relying on directory listings.",
  },
  {
    name: "AIR TECH SERVICES OF PASCO, INC.",
    slug: "air-tech-services-of-pasco",
    city: "Zephyrhills",
    phone: "(813) 779-7508",
    license: "CAC1815498",
    vertical: "hvac",
    headline: "AC & Heating in Zephyrhills",
    angle: "A maintained HVAC page gives callers a working owned page with the license, service area, and phone number visible immediately.",
  },
  {
    name: "CREATIVE MECHANICAL SOLUTIONS",
    slug: "creative-mechanical-solutions",
    city: "Zephyrhills",
    phone: "(813) 499-4608",
    license: "CAC1820888",
    vertical: "hvac",
    headline: "AC & Heating in Zephyrhills",
    angle: "A direct mechanical/HVAC page clarifies the local service, license, and phone-first path.",
  },
  {
    name: "RTD CONSTRUCTION, INC",
    slug: "rtd-construction",
    city: "Dade City",
    phone: "(352) 424-2727",
    license: "CFC1431848",
    vertical: "plumbing",
    headline: "Plumbing Service in Dade City",
    angle: "A simple plumbing page gives callers a direct way to confirm the license and call for service.",
  },
  {
    name: "TKJ CONSTRUCTION COMPANY INC",
    slug: "tkj-construction-company",
    city: "Dade City",
    phone: "(315) 527-5223",
    license: "CCC1327450",
    vertical: "roofing",
    headline: "Licensed Roofing in Dade City",
    angle: "A simple roofing page uses the DBPR phone-first path with visible license trust.",
  },
  {
    name: "WOOLFOLK CONSTRUCTION INC.",
    slug: "woolfolk-construction",
    city: "Zephyrhills",
    phone: "(813) 446-0304",
    license: "CCC1337416",
    vertical: "roofing",
    headline: "Licensed Roofing in Zephyrhills",
    angle: "A maintained roofing page gives a new active contractor a stronger owned trust signal and direct call path.",
  },
  {
    name: "HEART OF FLORIDA ELECTRIC, INC.",
    slug: "heart-of-florida-electric",
    city: "Auburndale",
    phone: "(863) 661-4985",
    license: "EC13005670",
    vertical: "electrical",
    headline: "Licensed Auburndale Electrician",
    angle: "A cleaner electrician preview puts the license, services, and call path in one maintained place.",
  },
];

const profiles = {
  hvac: {
    className: "hvac",
    cta: "Call for Service",
    eyebrow: "Cooling, heating, and mechanical service",
    motif: "Comfort airflow",
    bullets: ["Phone-first service path", "License visible above the fold", "Maintained local landing page"],
  },
  roofing: {
    className: "roofing",
    cta: "Call",
    eyebrow: "Roofing service and inspections",
    motif: "Roofline + storm-ready sky",
    bullets: ["Phone-first quote path", "License visible above the fold", "Maintained local roofing page"],
  },
  electrical: {
    className: "electrical",
    cta: "Call Now",
    eyebrow: "Licensed electrical service",
    motif: "Electric-blue utility",
    bullets: ["Phone-first service path", "License visible above the fold", "Maintained local electrical page"],
  },
  plumbing: {
    className: "plumbing",
    cta: "Call",
    eyebrow: "Licensed plumbing service",
    motif: "Clean waterline utility",
    bullets: ["Phone-first service path", "License visible above the fold", "Maintained local plumbing page"],
  },
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function baseCss() {
  return `
    :root {
      color-scheme: light;
      --ink: #101820;
      --muted: #526070;
      --line: rgba(16, 24, 32, .12);
      --paper: #f8fafc;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); }
    a { color: inherit; text-decoration: none; }
    .page { min-height: 100vh; }
    .hero {
      min-height: 720px;
      position: relative;
      overflow: hidden;
      color: #fff;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }
    .hero::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -2;
    }
    .hero::after {
      content: "";
      position: absolute;
      inset: auto -12% -35% -12%;
      height: 48%;
      z-index: -1;
      opacity: .58;
    }
    .hvac.hero::before {
      background:
        radial-gradient(circle at 82% 18%, rgba(176, 231, 255, .55), transparent 28%),
        linear-gradient(132deg, #0b2840 0%, #14607f 50%, #e6fbff 135%);
    }
    .hvac.hero::after {
      background: repeating-linear-gradient(166deg, rgba(255,255,255,.26) 0 12px, transparent 12px 34px);
      transform: rotate(-2deg);
    }
    .roofing.hero::before {
      background:
        linear-gradient(155deg, rgba(8, 22, 35, .92), rgba(28, 95, 137, .68) 48%, rgba(223, 242, 255, .8)),
        linear-gradient(25deg, transparent 0 46%, rgba(42, 48, 54, .92) 46% 57%, rgba(20, 25, 31, .98) 57% 100%);
    }
    .roofing.hero::after {
      background:
        linear-gradient(150deg, transparent 0 28%, rgba(11, 18, 24, .92) 28% 52%, transparent 52%),
        linear-gradient(25deg, transparent 0 42%, rgba(255, 255, 255, .22) 42% 45%, transparent 45%);
    }
    .electrical.hero::before {
      background:
        radial-gradient(circle at 78% 18%, rgba(116, 197, 255, .52), transparent 26%),
        linear-gradient(135deg, #071a33 0%, #103f75 52%, #d6eeff 132%);
    }
    .electrical.hero::after {
      background:
        linear-gradient(128deg, transparent 0 39%, rgba(255,255,255,.34) 39% 43%, transparent 43% 100%),
        repeating-linear-gradient(165deg, rgba(255,255,255,.18) 0 8px, transparent 8px 30px);
    }
    .plumbing.hero::before {
      background:
        radial-gradient(circle at 84% 16%, rgba(176, 244, 230, .5), transparent 28%),
        linear-gradient(135deg, #12343d 0%, #147b84 52%, #dffcf4 134%);
    }
    .plumbing.hero::after {
      background:
        repeating-linear-gradient(168deg, rgba(255,255,255,.2) 0 10px, transparent 10px 32px),
        linear-gradient(0deg, rgba(255,255,255,.2), rgba(255,255,255,0));
    }
    .nav {
      height: 92px;
      width: min(1180px, calc(100% - 48px));
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
      font-size: clamp(14px, 1.7vw, 18px);
    }
    .mark {
      width: 44px;
      height: 44px;
      border: 2px solid rgba(255,255,255,.74);
      display: grid;
      place-items: center;
      font-weight: 900;
      flex: 0 0 auto;
      background: rgba(255,255,255,.12);
    }
    .license {
      padding: 10px 14px;
      border: 1px solid rgba(255,255,255,.58);
      background: rgba(255,255,255,.14);
      font-size: 14px;
      font-weight: 800;
      white-space: nowrap;
    }
    .hero-content {
      width: min(1180px, calc(100% - 48px));
      margin: auto auto 82px;
      display: grid;
      gap: 24px;
      max-width: 1180px;
    }
    .eyebrow {
      margin: 0;
      font-size: 15px;
      line-height: 1.4;
      font-weight: 800;
      text-transform: uppercase;
      color: rgba(255,255,255,.78);
    }
    h1 {
      max-width: 780px;
      margin: 0;
      font-size: clamp(46px, 7vw, 92px);
      line-height: .98;
      letter-spacing: 0;
    }
    .subhead {
      max-width: 640px;
      margin: 0;
      color: rgba(255,255,255,.88);
      font-size: clamp(19px, 2vw, 25px);
      line-height: 1.35;
      font-weight: 600;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 54px;
      padding: 0 24px;
      background: #ffffff;
      color: #101820;
      font-weight: 900;
      border: 0;
    }
    .motif {
      color: rgba(255,255,255,.74);
      font-size: 15px;
      font-weight: 750;
    }
    .section {
      width: min(1100px, calc(100% - 48px));
      margin: 0 auto;
      padding: 74px 0;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
      gap: 52px;
      align-items: start;
    }
    .section h2 { margin: 0 0 16px; font-size: clamp(30px, 4vw, 52px); line-height: 1.04; letter-spacing: 0; }
    .section p { margin: 0; color: var(--muted); font-size: 18px; line-height: 1.65; }
    .panel {
      border: 1px solid var(--line);
      background: #fff;
      padding: 28px;
    }
    .panel h3 { margin: 0 0 18px; font-size: 18px; }
    .panel ul { margin: 0; padding: 0; display: grid; gap: 14px; list-style: none; }
    .panel li { display: flex; gap: 10px; color: #263545; font-weight: 700; }
    .panel li::before { content: ""; width: 9px; height: 9px; margin-top: 8px; background: #1f7a8c; flex: 0 0 auto; }
    footer { padding: 34px 24px 54px; text-align: center; color: var(--muted); }
    .teaser .hero { min-height: 780px; }
    .teaser .hero-content { margin-bottom: 126px; }
    .teaser .subhead, .teaser .motif, .teaser .eyebrow { display: none; }
    @media (max-width: 700px) {
      .hero { min-height: 700px; }
      .nav { width: min(100% - 32px, 1180px); height: 84px; align-items: flex-start; padding-top: 18px; flex-direction: column; gap: 10px; }
      .brand { font-size: 13px; line-height: 1.15; }
      .mark { width: 38px; height: 38px; }
      .license { font-size: 12px; padding: 8px 10px; }
      .hero-content { width: min(100% - 32px, 1180px); margin-bottom: 54px; gap: 18px; }
      h1 { font-size: clamp(38px, 14vw, 58px); }
      .subhead { font-size: 18px; }
      .cta { width: 100%; min-height: 56px; padding: 0 18px; }
      .section { width: min(100% - 32px, 1100px); grid-template-columns: 1fr; gap: 28px; padding: 54px 0; }
      .teaser .hero { min-height: 740px; }
      .teaser .hero-content { margin-bottom: 88px; }
    }
  `;
}

function initials(name) {
  return name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
}

function render({ prospect, teaser }) {
  const profile = profiles[prospect.vertical];
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(prospect.name)} Preview</title>
    <style>${baseCss()}</style>
  </head>
  <body class="${teaser ? "teaser" : "preview"}">
    <main class="page">
      <section class="hero ${profile.className}" aria-label="${esc(prospect.name)} header">
        <header class="nav">
          <div class="brand"><span class="mark">${esc(initials(prospect.name))}</span><span>${esc(prospect.name)}</span></div>
          <div class="license">FL Licensed ${esc(prospect.license)}</div>
        </header>
        <div class="hero-content">
          <p class="eyebrow">${esc(profile.eyebrow)}</p>
          <h1>${esc(prospect.headline)}</h1>
          <p class="subhead">We build it. We host it. We maintain it. You run your business.</p>
          <div class="hero-actions">
            <a class="cta" href="tel:${esc(prospect.phone.replace(/[^0-9]/g, ""))}">${esc(profile.cta)} ${esc(prospect.phone)}</a>
            <span class="motif">${esc(profile.motif)}</span>
          </div>
        </div>
      </section>
      ${teaser ? "" : `
      <section class="section">
        <div>
          <h2>A clearer owned page for local service calls.</h2>
          <p>${esc(prospect.angle)}</p>
        </div>
        <aside class="panel">
          <h3>Page priorities</h3>
          <ul>${profile.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </aside>
      </section>
      <footer>${esc(prospect.name)} - local preview asset for Website Support Studio.</footer>`}
    </main>
  </body>
</html>`;
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const manifest = [
  "# WSS 25 Touch Preview Assembly",
  "",
  "Generated local-only preview assets. No deployment, campaigns, or prospect research.",
  "",
  "| Prospect | Slug | Preview | Teaser |",
  "|---|---|---|---|",
];

for (const prospect of prospects) {
  const dir = path.join(outDir, prospect.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "preview.html"), render({ prospect, teaser: false }));
  await fs.writeFile(path.join(dir, "teaser.html"), render({ prospect, teaser: true }));
  manifest.push(`| ${prospect.name} | ${prospect.slug} | ${prospect.slug}/preview.html | ${prospect.slug}/teaser.html |`);
}

await fs.writeFile(path.join(outDir, "manifest.md"), `${manifest.join("\n")}\n`);
console.log(`Generated ${prospects.length} local preview/teaser pairs in ${outDir}`);
