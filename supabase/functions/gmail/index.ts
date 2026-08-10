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

/** Walk the MIME tree and collect the best text/plain and text/html bodies. */
function collectBodies(payload: any, out: { text: string; html: string }) {
  if (!payload) return out;
  const mime = payload.mimeType ?? "";
  if (payload.body?.data) {
    const decoded = b64urlDecode(payload.body.data);
    if (mime === "text/html" && !out.html) out.html = decoded;
    else if (mime === "text/plain" && !out.text) out.text = decoded;
    else if (!mime.startsWith("multipart/") && !out.text && !out.html) out.text = decoded;
  }
  for (const part of payload.parts ?? []) collectBodies(part, out);
  return out;
}

/** Collect inline images (cid references) so they can be embedded as data URLs. */
function collectInlineImages(payload: any, acc: { cid: string; attachmentId: string; mimeType: string }[] = []) {
  if (!payload) return acc;
  const cidHeader = (payload.headers ?? []).find(
    (h: any) => h.name?.toLowerCase() === "content-id",
  )?.value;
  if (
    cidHeader &&
    payload.body?.attachmentId &&
    (payload.mimeType ?? "").startsWith("image/")
  ) {
    acc.push({
      cid: cidHeader.replace(/[<>]/g, ""),
      attachmentId: payload.body.attachmentId,
      mimeType: payload.mimeType,
    });
  }
  for (const part of payload.parts ?? []) collectInlineImages(part, acc);
  return acc;
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
      const bodies = collectBodies(d.payload, { text: "", html: "" });

      // Inline cid: images -> data URLs so they render in the client
      let html = bodies.html;
      if (html) {
        const inline = collectInlineImages(d.payload);
        for (const img of inline) {
          if (!html.includes(`cid:${img.cid}`)) continue;
          try {
            const ar = await fetch(
              `${GATEWAY_URL}/users/me/messages/${id}/attachments/${img.attachmentId}`,
              { headers: gwHeaders() },
            );
            if (!ar.ok) continue;
            const ad = await ar.json();
            if (!ad.data) continue;
            const b64 = String(ad.data).replace(/-/g, "+").replace(/_/g, "/");
            html = html.split(`cid:${img.cid}`).join(`data:${img.mimeType};base64,${b64}`);
          } catch (_) {
            // ignore individual attachment failures
          }
        }
      }

      const plain =
        bodies.text ||
        (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

      return new Response(
        JSON.stringify({
          id: d.id,
          threadId: d.threadId,
          from: getHeader(headers, "From"),
          to: getHeader(headers, "To"),
          subject: getHeader(headers, "Subject"),
          date: getHeader(headers, "Date"),
          body: plain,
          html,
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
