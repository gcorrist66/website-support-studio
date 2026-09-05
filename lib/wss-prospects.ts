/**
 * WSS Outbound Prospect Data — Wave #1 + Campaign B
 * Source: wss-outbound-v1.csv (2026-06-14) · wss-campaign-b-final-send.html (2026-06-15)
 * Do NOT send outreach / import into Zoho until Gary approves.
 */

export type ScreenshotStatus = "captured" | "preview_not_built" | "pending_capture";
export type OutreachAngle = "A - Proof First" | "B - Screenshot First" | "C - Customer Experience First" | "D - Marketing Quality First";
export type Priority = "P1" | "P2" | "P3";
export type ProspectStatus = "ready" | "email needed" | "contact info needed" | "preview not built";
export type ActualOutreachStatus = "Not Contacted" | "Email Sent" | "Called" | "LinkedIn Sent" | "Replied" | "Won" | "Lost";

export interface WSSProspect {
  slug: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website?: string;
  industry: string;
  preview_url: string | null;
  subject_line: string;
  opening_line: string;
  email_copy?: string;
  outreach_angle: OutreachAngle;
  priority: Priority;
  score: number;
  status: ProspectStatus;
  primary_screenshot_type: "homepage" | "hero" | "mobile" | "portal" | null;
  screenshots_status: ScreenshotStatus;
  campaign?: "A" | "B";
  cta_url?: string;
  zoho_imported?: boolean;
  send_status?: "pending" | "sent" | "replied";
  actual_outreach_status?: ActualOutreachStatus;
  outreach_channel?: string;
  outreach_date?: string; // ISO 8601, e.g. "2026-06-15"
  zoho_id?: string;
}

export const WSS_PROSPECTS: WSSProspect[] = [
  // ─── Wave #1 — P1 (ready to send) ───────────────────────────────────────────
  {
    slug: "tonys-tree",
    business_name: "Tony's Tree Service LLC",
    owner_name: "Tony",
    email: "tonystreeservice21@gmail.com",
    phone: "(918) 430-9024",
    website: "tonystreeservice.com",
    industry: "Tree Service",
    preview_url: "https://previews.websitesupportstudio.com/tonys-tree",
    subject_line: "Tony — 136 Tulsa neighbors trust you. Here's what that looks like online.",
    opening_line: "Tony, I built a website for you using your 136 five-star Google reviews — wanted to show you what a site that leads with your proof actually looks like before reaching out.",
    outreach_angle: "A - Proof First",
    priority: "P1",
    score: 9,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    send_status: "sent",
    actual_outreach_status: "Email Sent",
    outreach_channel: "studio@websitesupportstudio.com",
    zoho_id: "1511887000001104001",
  },
  {
    slug: "austins-plumbing",
    business_name: "Austin's Greatest Plumbing",
    owner_name: "Rachel Humphreys",
    email: "austinsgreatestplumbing@gmail.com",
    phone: "(512) 377-9919",
    industry: "Plumber",
    preview_url: "https://previews.websitesupportstudio.com/austins-plumbing",
    subject_line: "Austin — your 149 five-star reviews deserve a better homepage.",
    opening_line: "I built a preview site for Austin's Greatest Plumbing that puts your 149 five-star reviews front and center — wanted to show you what that looks like before I reached out.",
    outreach_angle: "A - Proof First",
    priority: "P1",
    score: 9,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    send_status: "sent",
    actual_outreach_status: "Email Sent",
    outreach_channel: "studio@websitesupportstudio.com",
    zoho_id: "1511887000001104002",
  },
  {
    slug: "mh-electrical",
    business_name: "MH Electrical and Solar",
    owner_name: "Matt Heenan",
    email: "info@mhelectricalandsolar.com",
    phone: "(303) 915-0914",
    industry: "Electrician",
    preview_url: "https://previews.websitesupportstudio.com/mh-electrical",
    subject_line: "Matt — your electrical + solar expertise deserves a site that explains it clearly.",
    opening_line: "Matt, I built a preview site for MH Electrical and Solar — wanted to show you what a professional, modern site for a full-service electrical and solar contractor looks like.",
    outreach_angle: "D - Marketing Quality First",
    priority: "P1",
    score: 9,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    send_status: "sent",
    actual_outreach_status: "Email Sent",
    outreach_channel: "studio@websitesupportstudio.com",
    zoho_id: "1511887000001104003",
  },
  {
    slug: "ss-services",
    business_name: "S&S Services LLC",
    owner_name: "Unknown",
    email: "snsservices1llc@gmail.com",
    phone: "(614) 702-3395",
    industry: "Fence / Lawn",
    preview_url: "https://previews.websitesupportstudio.com/ss-services",
    subject_line: "S&S — 80 five-star reviews, one place to show them. Here's your preview.",
    opening_line: "I put together a preview site for S&S Services built around your 80 five-star Google reviews — wanted you to see what a site designed around your reputation looks like.",
    outreach_angle: "A - Proof First",
    priority: "P1",
    score: 8,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    send_status: "sent",
    actual_outreach_status: "Email Sent",
    outreach_channel: "studio@websitesupportstudio.com",
    zoho_id: "1511887000001104004",
  },
  {
    slug: "james-fence",
    business_name: "James' Fence Installation and More LLC",
    owner_name: "James Edmonds",
    email: "jamesedmonds258@gmail.com",
    phone: "(314) 302-3792",
    industry: "Fence Contractor",
    preview_url: "https://previews.websitesupportstudio.com/james-fence",
    subject_line: "James — your fence work is great. Does your website make it easy to hire you?",
    opening_line: "James, I put together a preview site for your fence installation business — built around making it simple for Hot Springs Village homeowners to find you and get a quote.",
    outreach_angle: "C - Customer Experience First",
    priority: "P1",
    score: 8,
    status: "ready",
    primary_screenshot_type: "mobile",
    screenshots_status: "captured",
    send_status: "sent",
    actual_outreach_status: "Email Sent",
    outreach_channel: "studio@websitesupportstudio.com",
    zoho_id: "1511887000001104005",
  },
  {
    slug: "golds-concrete",
    business_name: "Gold's Concrete Services",
    owner_name: "Andrew Gold",
    email: "goldsconcrete@gmail.com",
    phone: "(816) 741-3733",
    website: "goldsconcretekc.com",
    industry: "Concrete",
    preview_url: "https://previews.websitesupportstudio.com/golds-concrete",
    subject_line: "Gold's — your perfect 5.0 score deserves a homepage that shows it.",
    opening_line: "I built a preview site for Gold's Concrete Services that leads with your perfect 5.0 rating and 27 reviews — wanted to show you what that looks like before reaching out.",
    outreach_angle: "A - Proof First",
    priority: "P1",
    score: 7,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    zoho_id: "1511887000001104006",
  },

  // ─── Wave #1 — P2 (email research needed) ───────────────────────────────────
  {
    slug: "nashville-painting",
    business_name: "Nashville Painting Company",
    owner_name: "Jeremy Reeves",
    email: "sales@nashvillepaintingcompany.com",
    phone: "(615) 590-5050",
    website: "nashvillepaintingcompany.com",
    industry: "Painter",
    preview_url: "https://previews.websitesupportstudio.com/nashville-painting",
    subject_line: "Nashville Painting — here's a site that does your work justice.",
    opening_line: "I put together a preview site for Nashville Painting Company — wanted to show you what a professional painting contractor site looks like before reaching out.",
    outreach_angle: "D - Marketing Quality First",
    priority: "P2",
    score: 6,
    status: "ready",
    primary_screenshot_type: "hero",
    screenshots_status: "captured",
    zoho_id: "1511887000001104007",
  },

  // ─── Campaign B — Final Send (6 prospects) ───────────────────────────────────
  {
    slug: "construction-theory",
    business_name: "Construction Theory",
    owner_name: "Jeff Davies Jr.",
    email: "jeff@constructiontheory.com",
    phone: "(704) 401-4173",
    website: "constructiontheory.com",
    industry: "General Contractor",
    preview_url: "https://previews.websitesupportstudio.com/construction-theory",
    subject_line: "Construction Theory — here's a site as sharp as your builds.",
    opening_line: "I built a preview site for Construction Theory — wanted to show you what a sharp, professional general contractor website looks like before reaching out.",
    email_copy: `Hi Jeff,

I built a preview site for Construction Theory — wanted to show you what a sharp, professional general contractor website looks like before reaching out.

→ https://previews.websitesupportstudio.com/construction-theory

No pitch, no contract. I built it on my own time to show you what's possible for a contractor at your level.

If it looks like something worth talking about:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "D - Marketing Quality First",
    priority: "P2",
    score: 6,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },
  {
    slug: "akap-concrete",
    business_name: "AKAP Concrete LLC",
    owner_name: "Frank Meyer Jr.",
    email: "fmeyer@akap.com",
    phone: "(941) 250-7160",
    website: "",
    industry: "Concrete",
    preview_url: "https://previews.websitesupportstudio.com/akap-concrete",
    subject_line: "AKAP Concrete — here's your site built around what you actually do.",
    opening_line: "I put together a preview site for AKAP Concrete — a professional site built around what you actually do as a concrete contractor.",
    email_copy: `Hi Frank,

I put together a preview site for AKAP Concrete — a professional site built around what you actually do as a concrete contractor.

→ https://previews.websitesupportstudio.com/akap-concrete

No pitch, no contract. I built it on my own time to show you what a real online presence looks like for a concrete company.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "B - Screenshot First",
    priority: "P2",
    score: 6,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },
  {
    slug: "all-trees-considered",
    business_name: "All Trees Considered",
    owner_name: "Wes Ware",
    email: "team@alltreesconsideredllc.com",
    phone: "(440) 901-0995",
    website: "alltreesconsideredllc.com",
    industry: "Tree Service",
    preview_url: "https://previews.websitesupportstudio.com/all-trees-considered",
    subject_line: "All Trees Considered — here's a site built around your 139 five-star reviews.",
    opening_line: "I put together a preview site for All Trees Considered — built around your 139 five-star Google reviews and 82 Nextdoor picks.",
    email_copy: `Hi Wes,

I put together a preview site for All Trees Considered — built around your 139 five-star Google reviews and 82 Nextdoor picks.

→ https://previews.websitesupportstudio.com/all-trees-considered

Your proof of work is already there. This is just a site that finally shows it the right way.

No pitch, no contract. Take a look and see what you think.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "A - Proof First",
    priority: "P2",
    score: 7,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },
  {
    slug: "eastside-garage-door",
    business_name: "Eastside Garage Door",
    owner_name: "Jonathan Jacobs",
    email: "info@eastsidegaragedoor.com",
    phone: "(425) 500-6708",
    website: "eastsidegaragedoor.com",
    industry: "Garage Door",
    preview_url: "https://previews.websitesupportstudio.com/eastside-garage-door",
    subject_line: "Eastside Garage Door — your 92 five-star reviews deserve a site that shows them.",
    opening_line: "I built a preview site for Eastside Garage Door — a site that leads with what homeowners already say about you: 5.0 stars, 92 Google reviews, BBB accredited, not a franchise.",
    email_copy: `Hi Jon,

I built a preview site for Eastside Garage Door — a site that leads with what homeowners already say about you: 5.0 stars, 92 Google reviews, BBB accredited, not a franchise.

→ https://previews.websitesupportstudio.com/eastside-garage-door

Your story is a good one. This just makes it easy to find.

No pitch, no contract. Take a look and see if it's what you'd want representing your business.

If it's worth talking about:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "A - Proof First",
    priority: "P2",
    score: 7,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },
  {
    slug: "american-standard-garage",
    business_name: "American Standard Garage Door",
    owner_name: "Zach Wallace",
    email: "Americanstandardgaragedoors@gmail.com",
    phone: "(816) 804-0072",
    website: "americanstandardgaragedoor.com",
    industry: "Garage Door",
    preview_url: "https://previews.websitesupportstudio.com/american-standard-garage-door",
    subject_line: "American Standard — here's a site as honest as your work.",
    opening_line: "I built a preview site for American Standard Garage Door — a site built around the story your Google reviews already tell: owner answers, diagnoses honest, no upselling, gets it done same day.",
    email_copy: `Hi Zach,

I built a preview site for American Standard Garage Door — a site built around the story your Google reviews already tell: owner answers, diagnoses honest, no upselling, gets it done same day.

→ https://previews.websitesupportstudio.com/american-standard-garage-door

No pitch, no contract. I built it to show you what your business looks like when it's finally shown the right way.

If it's worth a few minutes:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "A - Proof First",
    priority: "P2",
    score: 7,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },
  {
    slug: "florida-boys-lawn",
    business_name: "Florida Boys Lawn & Landscape",
    owner_name: "Jorden Ross",
    email: "hello@floridaboyslandscape.com",
    phone: "(561) 886-7982",
    website: "floridaboyslandscape.com",
    industry: "Landscaping",
    preview_url: "https://previews.websitesupportstudio.com/florida-boys-landscape",
    subject_line: "Florida Boys — here's a site that looks like the lawn you keep driving past.",
    opening_line: "I built a preview site for Florida Boys Lawn & Landscape — built around what your Google reviews already say: 5.0 stars, owner-operated since 2009, and a third-generation Florida boy who actually answers his phone.",
    email_copy: `Hi Jorden,

I built a preview site for Florida Boys Lawn & Landscape — built around what your Google reviews already say: 5.0 stars, owner-operated since 2009, and a third-generation Florida boy who actually answers his phone.

→ https://previews.websitesupportstudio.com/florida-boys-landscape

No pitch, no contract. I built it to show you what your business looks like when it's finally shown the right way.

If it's worth a few minutes:
https://www.corristonconsulting.com/contact

— Gary Corriston
Website Support Studio`,
    outreach_angle: "C - Customer Experience First",
    priority: "P2",
    score: 7,
    status: "ready",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
    campaign: "B",
    cta_url: "https://www.corristonconsulting.com/contact",
    zoho_imported: false,
    send_status: "pending",
  },

  // ─── Pipeline — contact info needed ─────────────────────────────────────────
  {
    slug: "pressure-doctor",
    business_name: "Pressure Doctor Inc.",
    owner_name: "Unknown",
    email: "",
    phone: "(463) 258-7043",
    industry: "Pressure Washing",
    preview_url: "https://previews.websitesupportstudio.com/pressure-doctor",
    subject_line: "Pressure Doctor — here's what your business looks like with a real website.",
    opening_line: "I built a preview site for Pressure Doctor and wanted to show you what a professional pressure washing website looks like before reaching out.",
    outreach_angle: "B - Screenshot First",
    priority: "P2",
    score: 5,
    status: "email needed",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
  },
  {
    slug: "at-the-top-tree",
    business_name: "At The Top Tree Service LLC",
    owner_name: "Unknown",
    email: "",
    phone: "",
    industry: "Tree Service",
    preview_url: "https://previews.websitesupportstudio.com/at-the-top-tree",
    subject_line: "At The Top Tree — here's what your work looks like when it's shown right.",
    opening_line: "I put together a preview site for At The Top Tree Service — built around your actual work and reviews. Wanted to show you before reaching out.",
    outreach_angle: "B - Screenshot First",
    priority: "P2",
    score: 4,
    status: "contact info needed",
    primary_screenshot_type: "homepage",
    screenshots_status: "captured",
  },

  // ─── Pipeline — preview not built ────────────────────────────────────────────
  {
    slug: "rose-garage-door",
    business_name: "Rose Garage Door",
    owner_name: "Unknown",
    email: "",
    phone: "",
    industry: "Garage Door",
    preview_url: null,
    subject_line: "Rose Garage Door — here's your new site, built around your work.",
    opening_line: "I put together a preview site for Rose Garage Door — wanted to show you what a professional garage door service site looks like before reaching out.",
    outreach_angle: "B - Screenshot First",
    priority: "P3",
    score: 2,
    status: "preview not built",
    primary_screenshot_type: null,
    screenshots_status: "preview_not_built",
  },
  {
    slug: "jrc-concrete",
    business_name: "JRC Concrete",
    owner_name: "Unknown",
    email: "",
    phone: "",
    industry: "Concrete",
    preview_url: null,
    subject_line: "JRC Concrete — here's a site that shows what you actually build.",
    opening_line: "I put together a preview site for JRC Concrete — wanted to show you what a professional concrete contractor site looks like before reaching out.",
    outreach_angle: "B - Screenshot First",
    priority: "P3",
    score: 2,
    status: "preview not built",
    primary_screenshot_type: null,
    screenshots_status: "preview_not_built",
  },
];

// ─── Derived exports ──────────────────────────────────────────────────────────

export const WSS_LIVE_PROSPECTS = WSS_PROSPECTS.filter(p => p.screenshots_status === "captured");
export const WSS_P1 = WSS_PROSPECTS.filter(p => p.priority === "P1");
export const WSS_READY = WSS_PROSPECTS.filter(p => p.status === "ready");
export const WSS_CAMPAIGN_B = WSS_PROSPECTS.filter(p => p.campaign === "B");
