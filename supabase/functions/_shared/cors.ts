// Shared CORS helper for WSS edge functions.
// ALLOWED_ORIGINS (comma-separated) restricts exact origins.
// Vercel preview deployments for the marketing project are allowed by pattern.
const DEFAULT_ORIGINS = [
  "https://websitesupportstudio.com",
  "https://www.websitesupportstudio.com",
  "https://app.websitesupportstudio.com",
  "http://localhost:4321",
  "http://localhost:5173",
];

export function allowedOrigins(): string[] {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  return env ? env.split(",").map((o) => o.trim()).filter(Boolean) : DEFAULT_ORIGINS;
}

function isAllowedPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && /^website-support-studio-marketing-[a-z0-9-]+\.vercel\.app$/.test(url.hostname);
  } catch (_) {
    return false;
  }
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const list = allowedOrigins();
  const allow = origin && (list.includes(origin) || isAllowedPreviewOrigin(origin)) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Vary": "Origin",
  };
}
