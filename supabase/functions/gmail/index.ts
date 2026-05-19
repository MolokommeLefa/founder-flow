import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

function gwHeaders() {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY as string,
    "Content-Type": "application/json",
  };
}

function b64urlEncode(str: string) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return b64urlDecode(payload.body.data);
  if (payload.parts) {
    // Prefer text/plain
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain?.body?.data) return b64urlDecode(plain.body.data);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html?.body?.data) {
      return b64urlDecode(html.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    for (const part of payload.parts) {
      const inner = extractBody(part);
      if (inner) return inner;
    }
  }
  return "";
}

function getHeader(headers: any[], name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { q = "", maxResults = 20, labelIds } = params as {
        q?: string;
        maxResults?: number;
        labelIds?: string[];
      };
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      qs.set("maxResults", String(maxResults));
      if (labelIds) labelIds.forEach((l) => qs.append("labelIds", l));

      const listRes = await fetch(`${GATEWAY_URL}/users/me/messages?${qs}`, {
        headers: gwHeaders(),
      });
      const listData = await listRes.json();
      if (!listRes.ok) throw new Error(`Gmail list failed [${listRes.status}]: ${JSON.stringify(listData)}`);

      const ids: string[] = (listData.messages ?? []).map((m: any) => m.id);
      const messages = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(
            `${GATEWAY_URL}/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: gwHeaders() },
          );
          const d = await r.json();
          if (!r.ok) return null;
          const headers = d.payload?.headers ?? [];
          return {
            id: d.id,
            threadId: d.threadId,
            snippet: d.snippet ?? "",
            from: getHeader(headers, "From"),
            subject: getHeader(headers, "Subject"),
            date: getHeader(headers, "Date"),
            unread: (d.labelIds ?? []).includes("UNREAD"),
            labelIds: d.labelIds ?? [],
          };
        }),
      );

      return new Response(JSON.stringify({ messages: messages.filter(Boolean) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      const { id } = params as { id: string };
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}?format=full`, {
        headers: gwHeaders(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(`Gmail get failed [${r.status}]: ${JSON.stringify(d)}`);
      const headers = d.payload?.headers ?? [];
      return new Response(
        JSON.stringify({
          id: d.id,
          threadId: d.threadId,
          from: getHeader(headers, "From"),
          to: getHeader(headers, "To"),
          subject: getHeader(headers, "Subject"),
          date: getHeader(headers, "Date"),
          body: extractBody(d.payload),
          snippet: d.snippet ?? "",
          labelIds: d.labelIds ?? [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "send") {
      const { to, subject, body } = params as { to: string; subject: string; body: string };
      if (!to) throw new Error("Recipient (to) is required");
      const raw = b64urlEncode(
        [
          `To: ${to}`,
          `Subject: ${subject ?? ""}`,
          'Content-Type: text/plain; charset="UTF-8"',
          "",
          body ?? "",
        ].join("\r\n"),
      );
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
        method: "POST",
        headers: gwHeaders(),
        body: JSON.stringify({ raw }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(`Gmail send failed [${r.status}]: ${JSON.stringify(d)}`);
      return new Response(JSON.stringify({ ok: true, id: d.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "markRead") {
      const { id } = params as { id: string };
      const r = await fetch(`${GATEWAY_URL}/users/me/messages/${id}/modify`, {
        method: "POST",
        headers: gwHeaders(),
        body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(`Gmail modify failed [${r.status}]: ${JSON.stringify(d)}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("gmail function error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
