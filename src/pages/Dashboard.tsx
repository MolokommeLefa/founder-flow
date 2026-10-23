import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  FolderKanban,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TaskProgressCard from "@/components/dashboard/TaskProgressCard";
import TaskItem from "@/components/dashboard/TaskItem";
import OverallPerformance from "@/components/dashboard/OverallPerformance";
import { useTasks, DbTask } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useRevenue } from "@/hooks/useRevenue";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useProjects } from "@/hooks/useProjects";
import { getTodayFocusTasks } from "@/lib/todayFocus";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { tasks: dbTasks, loading: tasksLoading, updateTaskStatus, updateTask } = useTasks();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const { profile } = useProfile();
  const { entries: revenueEntries } = useRevenue();
  const { sessions: focusSessions } = useFocusSessions();
  const { projects } = useProjects();

  const handleComplete = async (task: DbTask) => {
    setBusyTaskId(task.id);
    await updateTaskStatus(task.id, "completed");
    setBusyTaskId(null);
    toast({ title: "Task completed", description: task.title });
  };

  const handlePostpone = async (task: DbTask) => {
    const base = task.due_date ? new Date(task.due_date) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = base < today ? new Date(today) : base;
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

  const { monthlyRevenue, revenueChange, revenueSparkline } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let current = 0;
    let previous = 0;
    revenueEntries.forEach((entry) => {
      const date = new Date(entry.entry_date);
      const amount = Number(entry.amount);
      if (date >= monthStart) current += amount;
      else if (date >= prevStart) previous += amount;
    });
    const spark: number[] = [];
    let running = 0;
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      running += revenueEntries.filter((entry) => entry.entry_date === key)
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      spark.push(running);
    }
    const pct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
    return {
      monthlyRevenue: current >= 1000 ? `$${(current / 1000).toFixed(1)}k` : `$${current.toFixed(0)}`,
      revenueChange: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`,
      revenueSparkline: spark,
    };
  }, [revenueEntries]);

  const weekFocusHours = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const seconds = focusSessions.filter((session) => new Date(session.started_at) >= start)
      .reduce((sum, session) => sum + session.duration_seconds, 0);
    return seconds / 3600 >= 1 ? `${(seconds / 3600).toFixed(1)}h` : `${Math.round(seconds / 60)}m`;
  }, [focusSessions]);

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Getting your workspace ready…</div>;
  }
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
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background text-foreground md:h-screen md:overflow-hidden">
      <div className="flex min-h-screen md:h-full">
        <aside className="hidden shrink-0 md:block">
          <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-7 md:py-7 xl:px-8">
          <div className="mx-auto max-w-[1600px] space-y-7">
            <DashboardHeader userName={userName} showGreeting priorityCount={highPriorityCount} />

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{today}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">A little more clarity. A little less noise.</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your workspace, at a glance.</p>
              </div>
              <Button onClick={() => navigate("/tasks")} variant="outline" className="rounded-xl border-border/80">
                Open task board <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <section aria-label="Workspace overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
              <Card className="rounded-2xl border-border/80 bg-card shadow-none transition-colors hover:border-border">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/70 text-foreground"><TrendingUp className="h-5 w-5" strokeWidth={1.6} /></div>
                    <Badge variant="outline" className="rounded-full border-lime-500/25 bg-lime-500/10 text-xs font-medium text-lime-600 dark:text-lime-400">{revenueChange} this month</Badge>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">{monthlyRevenue}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Monthly revenue</p>
                  <div className="mt-4 flex h-8 items-end gap-1" aria-label="Revenue trend over the last seven days">
                    {revenueSparkline.map((value, index) => {
                      const max = Math.max(...revenueSparkline, 1);
                      return <span key={index} className="flex-1 rounded-sm bg-lime-500/70" style={{ height: `${Math.max(12, (value / max) * 100)}%` }} />;
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 bg-card shadow-none transition-colors hover:border-border">
                <CardContent className="flex h-full items-center gap-5 p-5 sm:p-6">
                  <TaskProgressCard completed={completedCount} total={totalCount} />
                  <div className="min-w-0 flex-1 border-l border-border pl-5">
                    <p className="text-sm text-muted-foreground">Still in motion</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{openTasks}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tasks left to move forward</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 bg-card shadow-none transition-colors hover:border-border sm:col-span-2 xl:col-span-1">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/70 text-foreground"><Clock3 className="h-5 w-5" strokeWidth={1.6} /></div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-lime-500" /> Last 7 days</span>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">{weekFocusHours}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Time spent in focus</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-lime-600 dark:text-lime-400" /> Progress comes from showing up.</div>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(290px,0.82fr)]">
              <Card className="min-h-[390px] rounded-2xl border-border/80 bg-card shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
                  <div>
                    <CardTitle className="text-lg font-semibold tracking-tight">Today’s focus</CardTitle>
                    <CardDescription className="mt-1">{todayTasks.length ? `${todayTasks.length} priorities to give your attention to` : "A clear space to start something meaningful."}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")} className="rounded-lg text-muted-foreground hover:text-foreground">View all <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Button>
                </CardHeader>
                <CardContent className="px-3 pb-5 sm:px-4">
                  {tasksLoading ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Loading your tasks…</p>
                  ) : todayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/70"><Check className="h-5 w-5 text-lime-600 dark:text-lime-400" /></div>
                      <p className="mt-3 text-sm font-medium">You’re all caught up</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">Take a breath, or choose one small thing to make progress on.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/tasks")} className="mt-4 rounded-lg">Plan a task</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/70">
                      {todayTasks.map((task) => (
                        <div key={task.id} className="py-1 first:pt-0 last:pb-0">
                          <TaskItem
                            title={task.title}
                            status={mapStatus(task.status)}
                            priority={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            busy={busyTaskId === task.id}
                            onComplete={() => handleComplete(task)}
                            onPostpone={() => handlePostpone(task)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="flex-1 rounded-2xl border-border/80 bg-card shadow-none">
                  <CardHeader className="px-5 pb-2 pt-5 sm:px-6">
                    <CardTitle className="text-lg font-semibold tracking-tight">Quick summary</CardTitle>
                    <CardDescription>A softer overview of what’s on your plate.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 px-5 pb-5 sm:px-6">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Today</p>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/70"><Target className="h-4 w-4" /></div>
                        <div><p className="text-sm font-medium">{todayTasks.length} focus {todayTasks.length === 1 ? "priority" : "priorities"}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{highPriorityCount ? `${highPriorityCount} high-priority items need a little extra care.` : "Keep your pace steady and intentional."}</p></div>
                      </div>
                    </div>
                    <div className="border-t border-border/70 pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">This week</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-secondary/35 p-3"><p className="text-2xl font-semibold">{openTasks}</p><p className="mt-1 text-xs text-muted-foreground">Open tasks</p></div>
                        <div className="rounded-xl bg-secondary/35 p-3"><p className="text-2xl font-semibold">{activeProjects}</p><p className="mt-1 text-xs text-muted-foreground">Active projects</p></div>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => navigate("/calendar")} className="h-auto w-full justify-between rounded-xl px-3 py-3 text-sm text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Review your week</span><ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div><p className="text-sm font-medium">Overall performance</p><p className="mt-1 text-xs text-muted-foreground">A snapshot of your momentum</p></div>
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className={cn("[&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&_svg]:max-w-full")}>
                    <OverallPerformance tasks={dbTasks} />
                  </div>
                </div>
              </div>
            </section>
            <p className="pb-2 text-center text-xs text-muted-foreground/70">Make room for what matters.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
