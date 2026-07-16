import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_inbox",
  title: "List inbox messages",
  description: "List messages received by the signed-in user, newest first.",
  inputSchema: {
    unread_only: z.boolean().optional().describe("Return only unread messages."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unread_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("messages")
      .select("id,subject,body,sender_id,read,created_at")
      .eq("recipient_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (unread_only) q = q.eq("read", false);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { messages: data ?? [] },
    };
  },
});
