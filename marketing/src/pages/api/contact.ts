import type { APIRoute } from "astro";

export const prerender = false;

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const service = String(data.get("service") ?? "").trim();

  if (!name || !email || !service) {
    return json({ ok: false, message: "Name, email, and service are required." }, 400);
  }

  // Placeholder server action for a production integration (CRM, booking tool, or email service).
  return json({
    ok: true,
    message: "Demo endpoint accepted the submission.",
    data: {
      name,
      email,
      service,
      notes: String(data.get("notes") ?? "").trim()
    }
  });
};
