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
  name: "update_task_status",
  title: "Update task status",
  description: "Change the status of one of the signed-in user's tasks.",
  inputSchema: {
    task_id: z.string().uuid().describe("ID of the task to update."),
    status: z.enum(["not_started", "in_progress", "completed"]).describe("New status."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true },
  handler: async ({ task_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .update({ status })
      .eq("id", task_id)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Task ${task_id} set to ${status}` }],
      structuredContent: { task: data },
    };
  },
});
