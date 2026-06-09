// Shared CORS helper for WSS Stripe edge functions.
// ALLOWED_ORIGINS (comma-separated) restricts who may call create-checkout-session.
// Defaults to the marketing + app domains.
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

export function corsHeaders(origin: string | null): Record<string, string> {
  const list = allowedOrigins();
  const allow = origin && list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Vary": "Origin",
  };
}
