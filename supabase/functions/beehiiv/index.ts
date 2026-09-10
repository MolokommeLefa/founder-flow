import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const API = "https://api.beehiiv.com/v2";
const API_KEY = Deno.env.get("BEEHIIV_API_KEY") ?? "";
const PUB_ID = Deno.env.get("BEEHIIV_PUBLICATION_ID") ?? "";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalizePost(p: Record<string, any>) {
  const publishedAtRaw = p.publish_date ?? p.published_at ?? null;
  const published_at =
    typeof publishedAtRaw === "number"
      ? new Date(publishedAtRaw * 1000).toISOString()
      : publishedAtRaw
        ? new Date(publishedAtRaw).toISOString()
        : null;
  return {
    beehiiv_id: String(p.id),
    title: p.title ?? "",
    subtitle: p.subtitle ?? null,
    excerpt: p.preview_text ?? p.subtitle ?? null,
    thumbnail_url: p.thumbnail_url ?? p.image_url ?? null,
    web_url: p.web_url ?? null,
    status: p.status ?? "confirmed",
    published_at,
  };
}

async function savePosts(posts: Record<string, any>[]) {
  const rows = posts
    .filter((p) => p?.id)
    .map(normalizePost)
    .filter((r) => r.status !== "draft");
  if (!rows.length) return 0;
  const { error } = await admin
    .from("newsletter_posts")
    .upsert(rows, { onConflict: "beehiiv_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.pathname.split("/").filter(Boolean).pop();

  try {
    // --- beehiiv webhook: called by beehiiv when a post is published ---
    if (action === "webhook") {
      const payload = await req.json().catch(() => ({}));
      const data = payload?.data ?? payload?.post ?? payload;
      const posts = Array.isArray(data) ? data : [data];
      const saved = await savePosts(posts);
      return json({ ok: true, saved });
    }

    if (!API_KEY || !PUB_ID) {
      return json({ error: "beehiiv is not configured yet." }, 500);
    }

    // --- pull latest published posts from beehiiv ---
    if (action === "sync") {
      const res = await fetch(
        `${API}/publications/${PUB_ID}/posts?limit=6&status=confirmed&order_by=publish_date&direction=desc`,
        { headers: { Authorization: `Bearer ${API_KEY}` } },
      );
      const body = await res.json();
      if (!res.ok) return json({ error: body?.errors ?? "beehiiv request failed" }, 502);
      const saved = await savePosts(body?.data ?? []);
      return json({ ok: true, saved });
    }

    // --- subscribe ---
    if (action === "subscribe") {
      const { email } = await req.json().catch(() => ({ email: "" }));
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return json({ error: "Please enter a valid email address." }, 400);
      }
      const res = await fetch(`${API}/publications/${PUB_ID}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: "founderos-site",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("beehiiv subscribe failed", res.status, JSON.stringify(body));
        return json({ error: "Could not complete the signup. Please try again." }, 502);
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (e) {
    console.error("beehiiv function error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
