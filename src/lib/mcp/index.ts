import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTasks from "./tools/list-tasks";
import createTask from "./tools/create-task";
import updateTaskStatus from "./tools/update-task-status";
import listProjects from "./tools/list-projects";
import listInbox from "./tools/list-inbox";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "founderos-mcp",
  title: "FounderOS MCP",
  version: "0.1.0",
  instructions:
    "Tools for FounderOS. Use list_tasks / create_task / update_task_status to manage the signed-in user's tasks, list_projects to browse their projects, and list_inbox to read their inbox messages.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTasks, createTask, updateTaskStatus, listProjects, listInbox],
});
