const portalStyles = `.portal{background:#f8fafc}.portal .wrap{display:grid;grid-template-columns:.82fr 1.18fr;gap:34px;align-items:center}.portal h2{max-width:15ch}.portal-shell{background:#fff;border:1px solid var(--line,#e5e7eb);border-radius:8px;box-shadow:0 24px 70px rgba(15,23,42,.12);overflow:hidden;font-family:Arial,sans-serif}.portal-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid var(--line,#e5e7eb);background:#0f172a;color:#fff}.portal-title{font-weight:900;font-size:14px}.portal-tabs{display:flex;gap:6px}.portal-tab{width:36px;height:8px;border-radius:999px;background:rgba(255,255,255,.26)}.portal-tab:first-child{background:var(--accent,#2563eb)}.portal-body{display:grid;grid-template-columns:.92fr 1.08fr;min-height:300px}.portal-menu{background:#f1f5f9;border-right:1px solid var(--line,#e5e7eb);padding:16px;display:grid;gap:10px;align-content:start}.portal-menu-item{min-height:42px;border-radius:6px;background:#fff;border:1px solid #e2e8f0;padding:11px 12px;color:#334155;font:900 12px/1.25 Arial,sans-serif}.portal-menu-item:first-child{border-left:5px solid var(--accent,#2563eb);color:var(--ink,#111827)}.portal-panel{padding:18px;display:grid;gap:12px;align-content:start}.portal-card{border:1px solid var(--line,#e5e7eb);border-radius:8px;padding:16px;background:#fff}.portal-card h3{font:900 18px Arial,sans-serif;margin:0 0 7px;color:var(--ink,#111827)}.portal-card p{font:15px/1.45 Arial,sans-serif;margin:0;color:var(--muted,#5b6472)}@media(max-width:820px){.portal .wrap,.portal-body{grid-template-columns:1fr}.portal-menu{border-right:0;border-bottom:1px solid var(--line,#e5e7eb)}.portal-shell{margin-top:8px}}`;

export function wssClientPortalSection() {
  return `<section class="section portal"><div class="wrap"><div><p class="eyebrow">Included with Website Support Studio</p><h2>Your website comes with a support desk, not a disappearing web designer.</h2><p class="copy">After launch, the website is paired with a simple client portal for support, maintenance, and shared site information.</p></div><aside class="portal-shell" aria-label="Website Support Studio client portal mockup"><div class="portal-top"><span class="portal-title">Website Support Studio Client Portal</span><div class="portal-tabs" aria-hidden="true"><span class="portal-tab"></span><span class="portal-tab"></span><span class="portal-tab"></span></div></div><div class="portal-body"><div class="portal-menu"><span class="portal-menu-item">Open Requests</span><span class="portal-menu-item">Request Website Change</span><span class="portal-menu-item">Ask for Help</span><span class="portal-menu-item">Website Information</span></div><div class="portal-panel"><article class="portal-card"><h3>Request website changes</h3><p>Send edits, page updates, and content changes through one support path.</p></article><article class="portal-card"><h3>Ask for help</h3><p>Use the portal when something needs attention or you have a website question.</p></article><article class="portal-card"><h3>View website information</h3><p>Keep important site details and support context easy to find after launch.</p></article></div></div></aside></div></section>`;
}

export function injectWssClientPortal(html) {
  let next = html;

  if (!next.includes(".portal{background:#f8fafc}")) {
    next = next.replace("</style>", `${portalStyles}</style>`);
  }

  const section = wssClientPortalSection();
  const portalPattern = /<section class="section portal">[\s\S]*?<\/section>\s*/;

  if (portalPattern.test(next)) {
    next = next.replace(portalPattern, `${section}`);
  } else {
    next = next.replace(/<section class="section cta" id="contact">/, `${section}<section class="section cta" id="contact">`);
    next = next.replace(/<section class="cta" id="contact">/, `${section}<section class="cta" id="contact">`);
  }

  return next;
}
