const CURRENT_YEAR = new Date().getFullYear();

export function normalizeUrl(input) {
  const raw = String(input || "").trim();
  if (/^(no[-_\s]?site|none|n\/a|na|not found)$/i.test(raw)) throw new Error("missing_url");
  if (!raw) throw new Error("missing_url");
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid_url");
  if (/(^|\.)facebook\.com$|(^|\.)instagram\.com$|(^|\.)yelp\.com$|(^|\.)linkedin\.com$/i.test(url.hostname)) {
    throw new Error("social_only");
  }
  url.hash = "";
  return url.toString();
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)));
}

function textScore(score) {
  return typeof score === "number" ? clamp(score * 100) : null;
}

function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeBusinessText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(llc|inc|corp|corporation|company|co|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferLocalSearchTrade({ company, url }) {
  const text = `${company || ""} ${hostnameFromUrl(url)}`.toLowerCase();
  if (/roof/.test(text)) return "roofing contractor";
  if (/(hvac|heating|air|furnace|cooling)/.test(text)) return "hvac contractor";
  if (/plumb/.test(text)) return "plumber";
  if (/electric/.test(text)) return "electrician";
  if (/pool/.test(text)) return "pool service";
  if (/(sprinkler|irrigation)/.test(text)) return "irrigation contractor";
  if (/(garage|overhead.*door|door.*repair)/.test(text)) return "garage door repair";
  if (/(pest|exterminat|termite|rodent)/.test(text)) return "pest control";
  if (/(landscap|lawn|yard)/.test(text)) return "landscaping";
  if (/(tree|arbor|stump)/.test(text)) return "tree service";
  if (/(concrete|masonry|driveway|patio)/.test(text)) return "concrete contractor";
  if (/(pressure|power.*wash|exterior.*clean|soft.*wash)/.test(text)) return "pressure washing";
  return "local service business";
}

function numericAuditValue(audit) {
  return typeof audit?.numericValue === "number" ? audit.numericValue : null;
}

function secondsFromMs(value) {
  return typeof value === "number" ? Math.round((value / 1000) * 10) / 10 : null;
}

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function fetchText(url, timeoutMs = 12000) {
  const timeout = timeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "WebsiteSupportStudio-WebsiteHealthScore/1.0 (+https://websitesupportstudio.com/website-score)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: timeout.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, finalUrl: response.url, text };
  } finally {
    timeout.cancel();
  }
}

async function runPageSpeed(url, apiKey) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  ["performance", "seo", "accessibility", "best-practices"].forEach((category) => {
    endpoint.searchParams.append("category", category);
  });
  if (apiKey) endpoint.searchParams.set("key", apiKey);

  const timeout = timeoutSignal(45000);
  try {
    const response = await fetch(endpoint, { signal: timeout.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: body?.error?.message || `PageSpeed returned ${response.status}` };
    }
    const categories = body?.lighthouseResult?.categories || {};
    const audits = body?.lighthouseResult?.audits || {};
    return {
      ok: true,
      scores: {
        performance: textScore(categories.performance?.score),
        seo: textScore(categories.seo?.score),
        accessibility: textScore(categories.accessibility?.score),
        bestPractices: textScore(categories["best-practices"]?.score),
      },
      audits: {
        lcp: audits["largest-contentful-paint"]?.displayValue || "",
        lcpSeconds: secondsFromMs(numericAuditValue(audits["largest-contentful-paint"])),
        cls: audits["cumulative-layout-shift"]?.displayValue || "",
        clsValue: typeof audits["cumulative-layout-shift"]?.numericValue === "number" ? audits["cumulative-layout-shift"].numericValue : null,
        viewport: audits.viewport?.score === 1,
        documentTitle: audits["document-title"]?.score === 1,
        metaDescription: audits["meta-description"]?.score === 1,
        crawlableAnchors: audits["crawlable-anchors"]?.score === 1,
        tapTargets: audits["tap-targets"]?.score === 1,
      },
    };
  } catch (error) {
    return { ok: false, error: error?.name === "AbortError" ? "PageSpeed timed out" : String(error?.message || error) };
  } finally {
    timeout.cancel();
  }
}

async function runPlacesFindability({ company, city, state, url }, apiKey) {
  if (!apiKey) {
    return {
      available: false,
      score: null,
      issues: [
        {
          key: "places-not-configured",
          phrase: "Findability not measured",
          detail: "Google Places is not configured, so this audit could not check whether customers can find the business in Maps.",
          priority: 1,
        },
      ],
      place: null,
      error: "PLACES_API_KEY is not configured.",
    };
  }

  const fallbackName = hostnameFromUrl(url).replace(/\.(com|net|org|co|us)$/i, "").replace(/[-_]/g, " ");
  const businessName = String(company || "").trim() || fallbackName;
  const location = [city, state].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
  const query = [businessName, location].filter(Boolean).join(" ");
  const trade = inferLocalSearchTrade({ company: businessName, url });
  const localQuery = location ? `${trade} ${location}` : "";
  if (!query) {
    return {
      available: true,
      score: 0,
      issues: [
        {
          key: "no-business-query",
          phrase: "No business name or location available for Maps lookup",
          detail: "The audit needs a business name plus city or state to check Google Maps findability reliably.",
          priority: 100,
        },
      ],
      place: null,
      query: "",
    };
  }

  const timeout = timeoutSignal(15000);
  const searchPlaces = async (textQuery, maxResultCount = 3) => {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
        "x-goog-fieldmask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.businessStatus",
          "places.types",
          "places.websiteUri",
          "places.nationalPhoneNumber",
          "places.regularOpeningHours",
        ].join(","),
      },
      body: JSON.stringify({ textQuery, maxResultCount }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error?.message || `Google Places returned ${response.status}.`);
    }
    return Array.isArray(body.places) ? body.places : [];
  };
  try {
    const nameResults = await searchPlaces(query, 3);
    let categoryResults = [];
    try {
      categoryResults = localQuery ? await searchPlaces(localQuery, 10) : [];
    } catch {
      categoryResults = [];
    }

    const result = nameResults[0] || null;
    if (!result) {
      return {
        available: true,
        score: 0,
        issues: [
          {
            key: "not-found",
            phrase: `Not found in Google Maps for "${query}"`,
            detail: "Customers searching the business name and city may not see a clear Google Business Profile result.",
            priority: 120,
          },
          {
            key: "claim-profile",
            phrase: "Create or claim the Google Business Profile",
            detail: "A verified profile is the baseline for map visibility, reviews, calls, directions, and local trust.",
            priority: 110,
          },
        ],
        place: null,
        query,
      };
    }

    const rating = typeof result.rating === "number" ? result.rating : null;
    const reviews = typeof result.userRatingCount === "number" ? result.userRatingCount : 0;
    const operational = result.businessStatus === "OPERATIONAL";
    const hasProfileWebsite = Boolean(result.websiteUri);
    const hasProfilePhone = Boolean(result.nationalPhoneNumber);
    const hasHours = Boolean(result.regularOpeningHours);
    let listingScore = 20;
    if (operational) listingScore += 15;
    if (rating != null) listingScore += clamp((rating - 3.5) * 12, 0, 18);
    if (reviews >= 200) listingScore += 35;
    else if (reviews >= 100) listingScore += 28;
    else if (reviews >= 50) listingScore += 20;
    else if (reviews >= 20) listingScore += 12;
    else if (reviews >= 10) listingScore += 8;
    else if (reviews >= 1) listingScore += 5;
    if (hasProfileWebsite) listingScore += 4;
    if (hasProfilePhone) listingScore += 4;
    if (hasHours) listingScore += 4;
    listingScore = clamp(listingScore);

    const targetHost = hostnameFromUrl(url);
    const targetName = normalizeBusinessText(businessName);
    const categoryRank = categoryResults.findIndex((place) => {
      const placeHost = hostnameFromUrl(place.websiteUri || "");
      const placeName = normalizeBusinessText(place.displayName?.text || "");
      return (targetHost && placeHost && (placeHost === targetHost || placeHost.endsWith(`.${targetHost}`) || targetHost.endsWith(`.${placeHost}`))) ||
        (targetName && placeName && (placeName.includes(targetName) || targetName.includes(placeName)));
    });
    let categoryScore = localQuery ? 0 : 50;
    if (categoryRank === 0) categoryScore = 95;
    else if (categoryRank > 0 && categoryRank < 3) categoryScore = 55;
    else if (categoryRank >= 3 && categoryRank < 5) categoryScore = 40;
    else if (categoryRank >= 5 && categoryRank < 10) categoryScore = 25;
    const score = clamp((listingScore * 0.45) + (categoryScore * 0.55));

    const issues = [];
    if (!operational) {
      issues.push({
        key: "not-operational",
        phrase: "Google listing is not marked operational",
        detail: "The Maps listing status does not clearly show an active business.",
        priority: 115,
      });
    }
    if (reviews === 0) {
      issues.push({
        key: "no-reviews",
        phrase: "No Google reviews found",
        detail: "No visible review count means buyers have less proof before calling.",
        priority: 112,
      });
    } else if (reviews < 20) {
      issues.push({
        key: "low-reviews",
        phrase: `Only ${reviews} Google review${reviews === 1 ? "" : "s"} found`,
        detail: "That is a light review footprint for a local service business. More recent reviews can improve trust and local conversion.",
        priority: 104,
      });
    } else if (reviews < 50) {
      issues.push({
        key: "moderate-reviews",
        phrase: `${reviews} Google reviews found — build toward 50+`,
        detail: "The profile has proof, but more reviews can help it compete in local map results.",
        priority: 80,
      });
    } else if (reviews < 100) {
      issues.push({
        key: "good-not-dominant-reviews",
        phrase: `${reviews} Google reviews found — build toward 100+`,
        detail: "That is credible, but a stronger review base helps the listing compete in crowded service-area searches.",
        priority: 74,
      });
    }
    if (rating != null && rating < 4.3) {
      issues.push({
        key: "low-rating",
        phrase: `Google rating is ${rating.toFixed(1)}`,
        detail: "A rating below the local trust threshold can hurt calls even when the website is solid.",
        priority: 100,
      });
    }
    if (!hasProfileWebsite) {
      issues.push({
        key: "maps-no-website",
        phrase: "Google profile is missing a website link",
        detail: "A profile without a website link sends high-intent searchers to competitors or directories.",
        priority: 92,
      });
    }
    if (!hasProfilePhone) {
      issues.push({
        key: "maps-no-phone",
        phrase: "Google profile is missing a phone number",
        detail: "A missing phone number makes it harder for searchers to call straight from Maps.",
        priority: 90,
      });
    }
    if (!hasHours) {
      issues.push({
        key: "maps-no-hours",
        phrase: "Google profile is missing business hours",
        detail: "Hours help buyers know when to call and make the listing feel maintained.",
        priority: 70,
      });
    }
    if (localQuery && categoryRank < 0) {
      issues.push({
        key: "not-in-category-map",
        phrase: `Not showing in top local Maps results for "${localQuery}"`,
        detail: "The business has a profile, but buyers searching by service and city may not see it in the first page of map results.",
        priority: 118,
      });
    } else if (localQuery && categoryRank >= 1) {
      issues.push({
        key: "low-category-rank",
        phrase: `Position ${categoryRank + 1} in Maps for "${localQuery}"`,
        detail: "That is visible, but not the first map result where the highest-intent calls tend to happen.",
        priority: 96,
      });
    }
    if (!issues.length) {
      issues.push({
        key: "maps-strong",
        phrase: `${reviews} Google reviews at ${rating ? rating.toFixed(1) : "unknown"} stars`,
        detail: "The Maps profile has a strong visible trust signal. Keep review velocity current.",
        priority: 1,
      });
    }

    return {
      available: true,
      score,
      issues: issues.sort((a, b) => b.priority - a.priority).slice(0, 3),
      place: {
        name: result.displayName?.text || "",
        placeId: result.id || "",
        address: result.formattedAddress || "",
        rating,
        reviews,
        businessStatus: result.businessStatus || "",
        types: result.types || [],
        websiteUri: result.websiteUri || "",
        phone: result.nationalPhoneNumber || "",
        categoryQuery: localQuery,
        categoryRank: categoryRank >= 0 ? categoryRank + 1 : null,
        listingScore,
        categoryScore,
      },
      query,
    };
  } catch (error) {
    return {
      available: false,
      score: null,
      issues: [
        {
          key: "places-timeout",
          phrase: "Findability not measured",
          detail: error?.name === "AbortError" ? "Google Places timed out." : String(error?.message || error),
          priority: 1,
        },
      ],
      place: null,
      query,
      error: error?.name === "AbortError" ? "Google Places timed out." : String(error?.message || error),
    };
  } finally {
    timeout.cancel();
  }
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

function hasMetaViewport(html) {
  return /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html) || /<meta[^>]+content=["'][^"']*width=device-width/i.test(html);
}

function extractTitle(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function extractMetaDescription(html) {
  return html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
    "";
}

function quickChecks(normalizedUrl, homepage) {
  const html = homepage.text || "";
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const title = extractTitle(html);
  const metaDescription = extractMetaDescription(html);
  const h1Count = countMatches(html, /<h1\b/gi);
  const phoneCount = countMatches(html, /tel:|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/gi);
  const formCount = countMatches(html, /<form\b/gi);
  const quoteBookingPath = /(request|book|get|schedule|start|claim|reserve|free)\s+(a\s+)?(quote|estimate|inspection|consultation|appointment|service|visit|call|tune[-\s]?up|preview)|quote\s+request|book\s+online|schedule\s+online|get\s+started|free\s+website\s+preview/i.test(visibleText);
  const genericContactPath = /(contact us|call now|get in touch|send message|email us)/i.test(visibleText) || phoneCount > 0 || formCount > 0;
  const reviewSignals = /(review|reviews|stars?|testimonial|testimonials|google rating|rated|customer says|clients say)/i.test(visibleText);
  const credentialSignals = /(licensed|insured|certified|bbb|warranty|financing|locally owned|family owned|bonded|award|years in business)/i.test(visibleText);
  const photoSignals = /(<img\b|background-image|gallery|project|portfolio|before|after)/i.test(html);
  const staleYears = Array.from(html.matchAll(/(?:copyright|©|&copy;)[^0-9]{0,40}(20\d{2})/gi))
    .map((match) => Number(match[1]))
    .filter((year) => year && year < CURRENT_YEAR);

  return {
    https: normalizedUrl.startsWith("https://") || homepage.finalUrl?.startsWith("https://"),
    reachable: homepage.ok,
    finalUrl: homepage.finalUrl || normalizedUrl,
    viewport: hasMetaViewport(html),
    titlePresent: title.length > 0,
    metaDescriptionPresent: metaDescription.length > 0,
    titleLength: title.length,
    metaDescriptionLength: metaDescription.length,
    h1Present: h1Count > 0,
    h1Count,
    quoteBookingPath,
    genericContactPath,
    visibleContactPath: quoteBookingPath || genericContactPath,
    phonePresent: phoneCount > 0,
    formPresent: formCount > 0,
    reviewSignalsPresent: reviewSignals,
    credentialSignalsPresent: credentialSignals,
    photoSignalsPresent: photoSignals,
    trustSignalsPresent: reviewSignals || credentialSignals || photoSignals,
    staleCopyrightYear: staleYears.length ? Math.min(...staleYears) : null,
    htmlBytes: html.length,
  };
}

async function countSitemapPages(origin) {
  const base = origin.replace(/\/$/, "");
  const candidates = [`${base}/sitemap.xml`, `${base}/sitemap-index.xml`];
  try {
    const robots = await fetchText(`${base}/robots.txt`, 6000).catch(() => null);
    if (robots?.ok) {
      for (const match of robots.text.matchAll(/^sitemap:\s*(\S+)/gim)) {
        candidates.push(match[1].trim());
      }
    }

    let sitemap = null;
    for (const candidate of Array.from(new Set(candidates))) {
      const result = await fetchText(candidate, 10000).catch(() => null);
      if (result?.ok && result.text) {
        sitemap = result;
        break;
      }
    }
    if (!sitemap) return { found: false, count: 0 };
    const locs = Array.from(sitemap.text.matchAll(/<loc>(.*?)<\/loc>/gi)).map((match) => match[1].trim());
    const nested = locs.filter((loc) => /sitemap/i.test(loc)).slice(0, 3);
    let count = locs.filter((loc) => !/sitemap/i.test(loc)).length;
    for (const nestedUrl of nested) {
      const nestedSitemap = await fetchText(nestedUrl, 8000).catch(() => null);
      if (nestedSitemap?.ok) count += countMatches(nestedSitemap.text, /<loc>/gi);
    }
    return { found: true, count };
  } catch {
    return { found: false, count: 0 };
  }
}

function gradeTier(score) {
  if (score < 45) return "At Risk";
  if (score < 85) return "Needs Work";
  return "Strong";
}

function routingTag(healthScore, findabilityScore) {
  if (healthScore < 70) return "rebuild";
  if (typeof findabilityScore === "number" && findabilityScore < 70) return "get-found";
  return "skip";
}

function addIssue(issues, key, phrase, detail, category, priority = 50) {
  issues.push({ key, phrase, detail, category, priority });
}

function computeScores({ psi, checks, sitemap }) {
  const issues = [];
  const perf = psi.scores?.performance;
  const seoPsi = psi.scores?.seo;
  const accessibility = psi.scores?.accessibility;
  const bestPractices = psi.scores?.bestPractices;

  const speedMeasured = typeof perf === "number";
  const speedScore = speedMeasured ? perf : null;
  if (speedMeasured && speedScore < 75) {
    const lcp = psi.audits?.lcpSeconds ? ` (LCP about ${psi.audits.lcpSeconds}s)` : "";
    addIssue(issues, "speed", `Slow on mobile${lcp}`, "The mobile page speed score is below the level expected from a modern lead-generation site.", "Speed", 110);
  }

  let mobileScore = 100;
  if (!checks.viewport) mobileScore -= 55;
  if (psi.audits?.viewport === false) mobileScore -= 25;
  if (psi.audits?.tapTargets === false) mobileScore -= 15;
  if (accessibility != null && accessibility < 90) mobileScore -= Math.min(30, Math.round((90 - accessibility) * 0.8));
  mobileScore = clamp(mobileScore);
  if (!checks.viewport) addIssue(issues, "viewport", "Not mobile-friendly: viewport tag missing", "The page is missing a basic mobile setting, so it may render poorly on phones.", "Mobile", 105);
  else if (psi.audits?.viewport === false) addIssue(issues, "psi-viewport", "PageSpeed flagged the mobile viewport", "Google's mobile audit did not accept the page's viewport setup, so phone visitors may see a less reliable layout.", "Mobile", 86);
  if (psi.audits?.tapTargets === false) addIssue(issues, "tap-targets", "Mobile tap targets are too small or crowded", "Buttons and links should be easy to tap on a phone without zooming or hitting the wrong item.", "Mobile", 80);
  if (accessibility != null && accessibility < 80) addIssue(issues, "accessibility", `Mobile usability score is ${accessibility}/100`, "Text, buttons, labels, or contrast may be making the page harder to use.", "Mobile", 76);

  let foundScore = 100;
  if (seoPsi != null && seoPsi < 90) foundScore -= Math.min(35, Math.round((90 - seoPsi) * 0.9));
  if (!checks.titlePresent) foundScore -= 22;
  else if (checks.titleLength < 18 || checks.titleLength > 75) foundScore -= 8;
  if (!checks.metaDescriptionPresent) foundScore -= 22;
  else if (checks.metaDescriptionLength < 70) foundScore -= 8;
  if (!checks.h1Present) foundScore -= 18;
  if (!sitemap.found) foundScore -= 20;
  if (sitemap.found && sitemap.count <= 1) foundScore -= 18;
  else if (sitemap.found && sitemap.count > 1 && sitemap.count < 5) foundScore -= 12;
  foundScore = clamp(foundScore);
  if (!checks.titlePresent || !checks.metaDescriptionPresent || !checks.h1Present) {
    const missing = [
      !checks.titlePresent ? "title" : "",
      !checks.metaDescriptionPresent ? "meta description" : "",
      !checks.h1Present ? "main heading" : "",
    ].filter(Boolean).join(", ");
    addIssue(issues, "seo-basics", `Missing basic SEO signals: ${missing}`, "Search engines and customers need clear page titles, descriptions, and headings to understand the business.", "Found Online / SEO", 96);
  }
  if (!sitemap.found || sitemap.count === 0) addIssue(issues, "sitemap", "No sitemap found", "A sitemap helps search engines find the important pages on the site.", "Found Online / SEO", 78);
  else if (sitemap.count < 5) addIssue(issues, "thin-content", `Only ${sitemap.count} sitemap page${sitemap.count === 1 ? "" : "s"} found`, "That is a thin footprint for a local service business; service, area, and proof pages can create more ways to be found.", "Found Online / SEO", 92);

  let trustScore = 100;
  if (!checks.quoteBookingPath) trustScore -= 42;
  if (!checks.genericContactPath) trustScore -= 24;
  if (!checks.reviewSignalsPresent) trustScore -= 18;
  if (!checks.credentialSignalsPresent) trustScore -= 14;
  if (!checks.photoSignalsPresent) trustScore -= 10;
  if (checks.staleCopyrightYear) trustScore -= Math.min(24, (CURRENT_YEAR - checks.staleCopyrightYear) * 4 + 8);
  trustScore = clamp(trustScore);
  if (!checks.quoteBookingPath) {
    const phrase = checks.genericContactPath ? "No clear quote or booking button found" : "No obvious contact or booking path found";
    addIssue(issues, "cta", phrase, "A bare phone number or generic contact form is not enough. Visitors should see a direct quote, booking, estimate, or service request path.", "Trust & Conversion", 120);
  }
  if (checks.quoteBookingPath && !checks.genericContactPath) {
    addIssue(issues, "contact-backup", "No phone number or contact form backup found", "A booking button helps, but many visitors still look for a phone number, form, or clear contact fallback before they trust the business.", "Trust & Conversion", 82);
  }
  if (!checks.reviewSignalsPresent) addIssue(issues, "reviews", "No reviews or testimonials detected", "The page should show real customer proof so new visitors know the business is trusted.", "Trust & Conversion", 102);
  if (!checks.credentialSignalsPresent) addIssue(issues, "credentials", "No license, insurance, warranty, or credential signals detected", "Local service buyers look for proof that the business is legitimate before they call.", "Trust & Conversion", 84);
  if (checks.staleCopyrightYear) addIssue(issues, "stale", `Copyright year is ${checks.staleCopyrightYear}`, `That makes the site look stale in ${CURRENT_YEAR}. Update the footer and refresh visible proof that the business is active.`, "Trust & Conversion", 88);

  let securityScore = 100;
  if (!checks.https) securityScore -= 60;
  if (bestPractices != null && bestPractices < 90) securityScore -= Math.min(35, Math.round((90 - bestPractices) * 0.8));
  securityScore = clamp(securityScore);
  if (!checks.https) addIssue(issues, "https", "HTTPS is not active", "Browsers and customers expect the lock icon. Without it, trust drops before they read the page.", "Security", 112);
  if (bestPractices != null && bestPractices < 75) addIssue(issues, "best-practices", `Technical best-practices score is ${bestPractices}/100`, "The page has technical warnings that can affect browser trust or long-term maintenance.", "Security", 74);

  const weightedParts = [
    speedMeasured ? { score: speedScore, weight: 0.32 } : null,
    { score: mobileScore, weight: 0.16 },
    { score: foundScore, weight: 0.2 },
    { score: trustScore, weight: 0.24 },
    { score: securityScore, weight: 0.08 },
  ].filter(Boolean);
  const totalWeight = weightedParts.reduce((sum, part) => sum + part.weight, 0);
  let score = clamp(weightedParts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight);
  if (!speedMeasured) score = Math.min(score, 92);
  if (!checks.quoteBookingPath && !checks.genericContactPath) score = Math.min(score, 72);
  else if (!checks.quoteBookingPath) score = Math.min(score, 82);
  if (!checks.reviewSignalsPresent) score = Math.min(score, 86);
  if (sitemap.found && sitemap.count > 0 && sitemap.count < 5) score = Math.min(score, 78);
  if (!sitemap.found || sitemap.count === 0) score = Math.min(score, 76);

  const lowestCategory = [
    speedMeasured ? { name: "Speed", score: speedScore } : null,
    { name: "Mobile", score: mobileScore },
    { name: "Found Online / SEO", score: foundScore },
    { name: "Trust & Conversion", score: trustScore },
    { name: "Security", score: securityScore },
  ].filter(Boolean).sort((a, b) => a.score - b.score)[0];

  if (!issues.some((issue) => issue.priority > 20) && lowestCategory?.name === "Trust & Conversion" && trustScore < 95) addIssue(issues, "conversion-polish", `Trust & Conversion is the lowest category at ${trustScore}/100`, "The site is strong, but this is the most likely area to turn more visits into calls.", "Trust & Conversion", 30);
  if (!issues.some((issue) => issue.priority > 20) && lowestCategory?.name === "Found Online / SEO" && foundScore < 95) addIssue(issues, "seo-polish", `Found Online / SEO is the lowest category at ${foundScore}/100`, "Add more specific service, area, and proof content to capture more search intent.", "Found Online / SEO", 30);
  if (!issues.some((issue) => issue.priority > 20) && lowestCategory?.name === "Mobile" && mobileScore < 95) addIssue(issues, "mobile-polish", `Mobile is the lowest category at ${mobileScore}/100`, "Keep the phone experience easy to scan, tap, and submit.", "Mobile", 30);

  let topIssues = issues
    .sort((a, b) => b.priority - a.priority)
    .filter((issue) => issue.key !== "speed-not-measured")
    .slice(0, 3);
  if (!topIssues.length) {
    topIssues = [
      {
        key: "no-major-measured-issue",
        phrase: "No major issue found in measured checks",
        detail: speedMeasured
          ? "The visible homepage checks passed. Keep monitoring speed, conversion tracking, and fresh proof over time."
          : "The visible homepage checks passed. PageSpeed was unavailable, so speed still needs to be measured once the API key is active.",
        category: "Overall",
        priority: 1,
      },
    ];
  }

  return {
    score,
    tier: gradeTier(score),
    categories: [
      {
        name: "Speed",
        score: speedMeasured ? clamp(speedScore) : null,
        summary: speedMeasured
          ? speedScore >= 75 ? "Measured mobile speed is acceptable." : "Measured mobile speed needs attention."
          : "Not measured. PageSpeed was unavailable, so speed is excluded from the total.",
        measured: speedMeasured,
      },
      { name: "Mobile", score: mobileScore, summary: mobileScore >= 75 ? "Mobile basics are in place." : "Phone visitors may be struggling." },
      { name: "Found Online / SEO", score: foundScore, summary: foundScore >= 75 ? "Search basics are visible." : "Search engines need clearer signals." },
      { name: "Trust & Conversion", score: trustScore, summary: trustScore >= 75 ? "Visitors can find proof and next steps." : "The page needs stronger proof and a clearer action path." },
      { name: "Security", score: securityScore, summary: securityScore >= 75 ? "Security basics look acceptable." : "Trust and security need attention." },
    ],
    topIssues,
  };
}

export async function auditWebsite(inputUrl, options = {}) {
  const apiKey = options.pageSpeedApiKey || process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY || "";
  const placesApiKey = options.placesApiKey || process.env.PLACES_API_KEY || "";
  let normalizedUrl;
  try {
    normalizedUrl = normalizeUrl(inputUrl);
  } catch {
    return unreachableResult(inputUrl, "Enter a valid website URL.");
  }

  let homepage;
  try {
    homepage = await fetchText(normalizedUrl, options.homepageTimeoutMs || 12000);
  } catch {
    return unreachableResult(normalizedUrl, "We could not reach the homepage.");
  }

  if (!homepage.ok || !homepage.text) {
    return unreachableResult(normalizedUrl, `The site returned HTTP ${homepage.status || "unreachable"}.`);
  }

  const finalUrl = homepage.finalUrl || normalizedUrl;
  const origin = new URL(finalUrl).origin;
  const [psi, sitemap, findability] = await Promise.all([
    runPageSpeed(finalUrl, apiKey),
    countSitemapPages(origin),
    runPlacesFindability({
      company: options.company,
      city: options.city,
      state: options.state,
      url: finalUrl,
    }, placesApiKey),
  ]);
  const checks = quickChecks(normalizedUrl, homepage);
  const computed = computeScores({ psi, checks, sitemap });
  const findabilityScore = typeof findability.score === "number" ? findability.score : null;
  const route = routingTag(computed.score, findabilityScore);

  return {
    ok: true,
    requestedUrl: inputUrl,
    finalUrl,
    generatedAt: new Date().toISOString(),
    pageSpeed: {
      available: psi.ok,
      error: psi.ok ? "" : psi.error || "",
      scores: psi.scores || {},
      metrics: psi.audits || {},
    },
    checks: {
      ...checks,
      sitemapFound: sitemap.found,
      pageCount: sitemap.count,
    },
    findability: {
      available: findability.available,
      score: findabilityScore,
      query: findability.query || "",
      place: findability.place,
      error: findability.error || "",
      topIssues: findability.issues || [],
    },
    findability_score: findabilityScore,
    findability_top_issues: (findability.issues || []).map((issue) => issue.phrase).join("; "),
    routing_tag: route,
    ...computed,
    top_3_issues: computed.topIssues.map((issue) => issue.phrase).join("; "),
  };
}

function unreachableResult(inputUrl, detail) {
  return {
    ok: true,
    requestedUrl: inputUrl,
    finalUrl: "",
    generatedAt: new Date().toISOString(),
    score: 0,
    tier: "At Risk",
    categories: [
      { name: "Speed", score: 0, summary: "The site could not be tested." },
      { name: "Mobile", score: 0, summary: "The site could not be tested." },
      { name: "Found Online / SEO", score: 0, summary: "The site could not be tested." },
      { name: "Trust & Conversion", score: 0, summary: "Customers may not be reaching the site at all." },
      { name: "Security", score: 0, summary: "The site could not be tested." },
    ],
    topIssues: [
      {
        key: "unreachable",
        phrase: "Make the website reachable",
        detail: `${detail} The biggest opportunity is making sure customers can open the site from search, maps, and ads.`,
        category: "Security",
        priority: 100,
      },
      {
        key: "presence",
        phrase: "Create a dependable web presence",
        detail: "A working website gives customers one clear place to understand services, trust the business, and request help.",
        category: "Trust & Conversion",
        priority: 90,
      },
      {
        key: "capture",
        phrase: "Add a quote or booking path",
        detail: "Once the site is reachable, the next win is a clear request path for calls, quotes, or appointments.",
        category: "Trust & Conversion",
        priority: 80,
      },
    ],
    top_3_issues: "Make the website reachable; Create a dependable web presence; Add a quote or booking path",
    findability: {
      available: true,
      score: 0,
      query: "",
      place: null,
      error: "",
      topIssues: [
        {
          key: "no-web-presence",
          phrase: "No website found — biggest opportunity",
          detail: "Customers need both a real website and a visible Google profile to find and trust the business.",
          priority: 120,
        },
      ],
    },
    findability_score: 0,
    findability_top_issues: "No website found — biggest opportunity",
    routing_tag: "rebuild",
    checks: {
      reachable: false,
      sitemapFound: false,
      pageCount: 0,
    },
    pageSpeed: {
      available: false,
      error: detail,
      scores: {},
      metrics: {},
    },
  };
}
