import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const POLAR_API = "https://api.polar.sh/v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("POLAR_ACCESS_TOKEN");
  if (!token) return json({ error: "POLAR_ACCESS_TOKEN is not configured" }, 500);

  const polar = (path: string, init: RequestInit = {}) =>
    fetch(`${POLAR_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

  try {
    const { action, product_id, checkout_id, success_url } = await req.json();

    if (action === "products") {
      const res = await polar("/products?is_archived=false&limit=20");
      const data = await res.json();
      return json(data, res.ok ? 200 : res.status);
    }

    if (action === "verify") {
      if (!checkout_id) return json({ error: "checkout_id is required" }, 400);
      const res = await polar(`/checkouts/${checkout_id}`);
      const data = await res.json();
      if (!res.ok) return json(data, res.status);
      return json({ status: data.status, product_name: data.product?.name ?? null });
    }

    if (action === "checkout") {
      if (!product_id) return json({ error: "product_id is required" }, 400);

      const authHeader = req.headers.get("Authorization") ?? "";
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return json({ error: "Not authenticated" }, 401);

      const res = await polar("/checkouts/", {
        method: "POST",
        body: JSON.stringify({
          products: [product_id],
          external_customer_id: user.id,
          customer_email: user.email,
          success_url: `${success_url}?checkout_id={CHECKOUT_ID}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) return json(data, res.status);
      return json({ url: data.url });
    }

    if (action === "portal") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return json({ error: "Not authenticated" }, 401);

      const res = await polar("/customer-sessions/", {
        method: "POST",
        body: JSON.stringify({ external_customer_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) return json(data, res.status);
      return json({ url: data.customer_portal_url });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
