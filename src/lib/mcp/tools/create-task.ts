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
  name: "create_task",
  title: "Create task",
  description: "Create a new task for the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Task title."),
    description: z.string().optional().describe("Optional task description."),
    priority: z.enum(["low", "medium", "high"]).optional().describe("Task priority."),
    status: z
      .enum(["not_started", "in_progress", "completed"])
      .optional()
      .describe("Initial status (default not_started)."),
    due_date: z.string().optional().describe("Due date as ISO 8601 timestamp."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ title, description, priority, status, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("tasks")
      .insert({
        user_id: ctx.getUserId(),
        title,
        description,
        priority: priority ?? "medium",
        status: status ?? "not_started",
        due_date,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created task ${data.id}` }],
      structuredContent: { task: data },
    };
  },
});
