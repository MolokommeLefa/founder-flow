import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import {
  ArrowUpRight, CalendarDays, Check, FolderKanban, Lightbulb, ListTodo, Target, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TaskItem from "@/components/dashboard/TaskItem";
import OverallPerformance from "@/components/dashboard/OverallPerformance";
import { useTasks, DbTask } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useProjects } from "@/hooks/useProjects";
import { getTodayFocusTasks } from "@/lib/todayFocus";
import { toast } from "@/hooks/use-toast";

const mapStatus = (status: DbTask["status"]): "done" | "pending" | "urgent" => {
  if (status === "completed") return "done";
  if (status === "in_progress") return "pending";
  return "urgent";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const { tasks: dbTasks, loading: tasksLoading, updateTaskStatus, updateTask } = useTasks();
  const { profile } = useProfile();
  const { projects } = useProjects();
  const [activeAutomationCount, setActiveAutomationCount] = useState(() => {
    try {
      const stored = localStorage.getItem("lumaco:automations");
      if (stored === null) return 1;
      const workflows: Array<{ active?: boolean }> = JSON.parse(stored);
      return Array.isArray(workflows) ? workflows.filter((workflow) => workflow.active).length : 0;
    } catch {
      return 0;
    }
  });

  const handleComplete = async (task: DbTask) => {
    setBusyTaskId(task.id);
    await updateTaskStatus(task.id, "completed");
    setBusyTaskId(null);
    toast({ title: "Task completed", description: task.title });
  };

  const handlePostpone = async (task: DbTask) => {
    const base = task.due_date ? new Date(task.due_date) : new Date();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const next = base < todayDate ? new Date(todayDate) : base;
    next.setDate(next.getDate() + 1);
    setBusyTaskId(task.id);
    await updateTask(task.id, {
      title: task.title,
      description: task.description ?? undefined,
      status: task.status,
      priority: task.priority,
      due_date: next.toISOString().slice(0, 10),
      color: task.color,
      start_time: task.start_time ?? undefined,
      end_time: task.end_time ?? undefined,
    });
    setBusyTaskId(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const syncAutomationCount = () => {
      try {
        const stored = localStorage.getItem("lumaco:automations");
        if (stored === null) return;
        const workflows: Array<{ active?: boolean }> = JSON.parse(stored);
        setActiveAutomationCount(Array.isArray(workflows) ? workflows.filter((workflow) => workflow.active).length : 0);
      } catch {
        setActiveAutomationCount(0);
      }
    };
    window.addEventListener("storage", syncAutomationCount);
    return () => window.removeEventListener("storage", syncAutomationCount);
  }, []);

  if (loading) return <div className="dark flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Getting your workspace ready…</div>;
  if (!user) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const nickname = firstName.length > 10 ? firstName.slice(0, 10) : firstName;
  const fallbackName = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
  const userName = profile?.display_name?.trim() || fallbackName;
  const todayTasks = getTodayFocusTasks(dbTasks, 5);
  const completedCount = dbTasks.filter((task) => task.status === "completed").length;
  const totalCount = dbTasks.length;
  const openTasks = dbTasks.filter((task) => task.status !== "completed").length;
  const highPriorityCount = dbTasks.filter((task) => task.priority === "high" && task.status !== "completed").length;
  const activeProjects = projects.filter((project: any) => !["completed", "archived"].includes(String(project.status ?? "").toLowerCase())).length;
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dueTodayTasks = dbTasks.filter((task) => task.status !== "completed" && task.due_date === todayKey);
  const scheduledTodayTasks = dueTodayTasks.filter((task) => task.start_time);
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  const suggestedTask = [...dueTodayTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];
  const focusSuggestion = suggestedTask
    ? `Start with “${suggestedTask.title}” to make progress on today’s most immediate deadline.`
    : scheduledTodayTasks.length > 0
      ? "Leave a little breathing room around your scheduled work today."
      : activeProjects > 0
        ? "Choose one clear next step on an active project and give it your best focus."
        : openTasks > 0
          ? "Pick one open task and decide when you’ll tackle it."
          : "You’re clear for today. Use the space to plan what matters next.";
  return (
    <div className="dark dashboard-shell min-h-screen bg-background text-foreground md:h-screen md:overflow-hidden">
      <div className="flex min-h-screen overflow-hidden bg-background md:h-screen">
        <aside className="hidden shrink-0 md:block">
          <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-7 md:py-7 xl:px-8">
          <div className="mx-auto max-w-[1680px] space-y-6 xl:space-y-7">
            <DashboardHeader userName={userName} showGreeting priorityCount={todayTasks.filter((task) => task.priority === "high" && task.status !== "completed").length} />

            <section aria-label="Workspace overview" className="grid grid-cols-3 gap-2.5 sm:gap-3 xl:gap-4">
              <Card className="dashboard-panel min-w-0 rounded-lg border-border/70 bg-card shadow-none">
                <CardContent className="flex min-h-[112px] flex-col justify-between gap-3 p-3.5 sm:min-h-[132px] sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs leading-snug text-muted-foreground sm:text-sm">Total tasks done</p>
                    <Check className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-tight sm:text-3xl">{completedCount}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">of {totalCount} total tasks</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dashboard-panel min-w-0 rounded-lg border-border/70 bg-card shadow-none">
                <CardContent className="flex min-h-[112px] flex-col justify-between gap-3 p-3.5 sm:min-h-[132px] sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs leading-snug text-muted-foreground sm:text-sm">Active projects</p>
                    <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-tight sm:text-3xl">{activeProjects}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">In progress</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dashboard-panel min-w-0 rounded-lg border-border/70 bg-card shadow-none">
                <CardContent className="flex min-h-[112px] flex-col justify-between gap-3 p-3.5 sm:min-h-[132px] sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs leading-snug text-muted-foreground sm:text-sm">Active automations</p>
                    <Zap className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-tight sm:text-3xl">{activeAutomationCount}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">Running workflows</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(290px,0.82fr)]">
              <Card className="dashboard-panel min-h-[380px] rounded-xl border-border/80 bg-card shadow-none">
                <CardContent className="px-3 py-5 sm:px-4">
                  {tasksLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading your tasks…</p> : todayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border"><Check className="h-5 w-5 text-lime-400" /></div>
                      <p className="mt-3 text-sm font-medium">You’re all caught up</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">Take a breath, or choose one small thing to make progress on.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/tasks")} className="mt-4 rounded-lg">Plan a task</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {todayTasks.map((task) => (
                        <div key={task.id} className="py-1 first:pt-0 last:pb-0">
                          <TaskItem title={task.title} status={mapStatus(task.status)} priority={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} busy={busyTaskId === task.id} onComplete={() => handleComplete(task)} onPostpone={() => handlePostpone(task)} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="dashboard-panel flex-1 rounded-xl border-border/80 bg-card shadow-none">
                  <CardHeader className="px-5 pb-3 pt-5 sm:px-6">
                    <CardTitle className="text-xl font-medium tracking-tight">Quick summary</CardTitle>
                    <CardDescription className="text-xs">A quiet overview of what’s on your plate.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 px-5 pb-5 sm:px-6">
                    <div>
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Today</p>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground"><Target className="h-4 w-4" /></div>
                        <div><p className="text-sm font-medium">{todayTasks.length} focus {todayTasks.length === 1 ? "priority" : "priorities"}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{highPriorityCount ? `${highPriorityCount} high-priority items need a little extra care.` : "Keep your pace steady and intentional."}</p></div>
                      </div>
                    </div>
                    <div className="border-t border-border/70 pt-4">
                      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">This week</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border/70 p-3"><p className="text-2xl font-medium">{openTasks}</p><p className="mt-1 text-xs text-muted-foreground">Open tasks</p></div>
                        <div className="rounded-lg border border-border/70 p-3"><p className="text-2xl font-medium">{activeProjects}</p><p className="mt-1 text-xs text-muted-foreground">Active projects</p></div>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => navigate("/calendar")} className="h-auto w-full justify-between rounded-lg px-3 py-3 text-sm text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Review your week</span><ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                <Card className="dashboard-panel rounded-xl border-border/80 bg-card shadow-none">
                  <CardHeader className="px-5 pb-3 pt-4 sm:px-6">
                    <CardTitle className="text-sm font-medium">Today at a glance</CardTitle>
                    <CardDescription className="text-xs">A live overview of your workspace.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-4 sm:px-6">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="min-w-0">
                        <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                          <ListTodo className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          <span className="truncate text-[11px]">Due today</span>
                        </div>
                        <p className="text-lg font-medium">{dueTodayTasks.length}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          <span className="truncate text-[11px]">On calendar</span>
                        </div>
                        <p className="text-lg font-medium">{scheduledTodayTasks.length}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                          <FolderKanban className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                          <span className="truncate text-[11px]">Active projects</span>
                        </div>
                        <p className="text-lg font-medium">{activeProjects}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 border-t border-border/70 pt-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground">Suggested focus</p>
                        <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{focusSuggestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="dashboard-panel rounded-xl border-border/80 bg-card shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5 sm:px-6">
                    <div><CardTitle className="text-sm font-medium">Overall performance</CardTitle><CardDescription className="mt-1 text-xs">A snapshot of your momentum</CardDescription></div>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-5 pb-5 sm:px-6">
                    <div className="[&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&_svg]:max-w-full">
                      <OverallPerformance tasks={dbTasks} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
            <p className="pb-2 text-center text-[11px] text-muted-foreground/70">Make room for what matters.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
