import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ContributionHeatmap from "@/components/dashboard/ContributionHeatmap";
import MetricCard from "@/components/dashboard/MetricCard";
import TaskProgressCard from "@/components/dashboard/TaskProgressCard";
import { useTasks } from "@/hooks/useTasks";
import { useRevenue } from "@/hooks/useRevenue";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import AddRevenueDialog from "@/components/analytics/AddRevenueDialog";
import { DollarSign, Clock, BarChart3 } from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";

type Range = 30 | 60 | 90 | "custom";

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [range, setRange] = useState<Range>(30);
  const { tasks } = useTasks();
  const { entries: revenueEntries } = useRevenue();
  const { sessions: focusSessions } = useFocusSessions();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  const days = range === "custom" ? 120 : range;

  // Build per-day revenue series from real entries within range
  const revenueData = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const series: { date: string; key: string; revenue: number; target: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
      series.push({
        key,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: 0,
        target: 0,
      });
    }

    revenueEntries.forEach((e) => {
      if (buckets.has(e.entry_date)) {
        buckets.set(e.entry_date, (buckets.get(e.entry_date) || 0) + Number(e.amount));
      }
    });

    // Cumulative running total feels more useful for "performance"
    let running = 0;
    const total = revenueEntries
      .filter((e) => buckets.has(e.entry_date))
      .reduce((s, e) => s + Number(e.amount), 0);
    const dailyTarget = total > 0 ? total / days : 0;
    let runningTarget = 0;

    return series.map((pt) => {
      running += buckets.get(pt.key) || 0;
      runningTarget += dailyTarget;
      return { ...pt, revenue: Math.round(running), target: Math.round(runningTarget) };
    });
  }, [revenueEntries, days]);

  const totalRevenue = useMemo(
    () =>
      revenueEntries.reduce((s, e) => {
        const d = new Date(e.entry_date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return d >= cutoff ? s + Number(e.amount) : s;
      }, 0),
    [revenueEntries, days]
  );

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalTasks = tasks.length;

  const focusHours = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const sec = focusSessions
      .filter((s) => new Date(s.started_at) >= cutoff)
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    return +(sec / 3600).toFixed(1);
  }, [focusSessions, days]);

  // Sparklines
  const revenueSparkline = revenueData.slice(-12).map((d) => d.revenue);
  const tasksSparkline = useMemo(() => {
    const arr = new Array(8).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tasks
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const d = new Date(t.updated_at);
        const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
        if (diff >= 0 && diff < 8) arr[7 - diff] += 1;
      });
    return arr;
  }, [tasks]);
  const focusSparkline = useMemo(() => {
    const arr = new Array(8).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    focusSessions.forEach((s) => {
      const d = new Date(s.started_at);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 8) arr[7 - diff] += s.duration_seconds / 3600;
    });
    return arr.map((v) => +v.toFixed(2));
  }, [focusSessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const ranges: Range[] = [30, 60, 90, "custom"];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar
          activeItem="Analytics"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        {/* Title */}
        <div className="mb-6 mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mt-1">Track your productivity</p>
          </div>
          <AddRevenueDialog />
        </div>

        {/* Top row: metrics + heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon={DollarSign}
              label="Revenue"
              value={`$${(totalRevenue / 1000).toFixed(1)}k`}
              change={`${days}d`}
              positive
              sparklineData={revenueSparkline.length ? revenueSparkline : [0, 0, 0, 0]}
            />
            <TaskProgressCard
              completed={completedTasks}
              total={totalTasks}
            />
            <MetricCard
              icon={Clock}
              label="Hours Focused"
              value={`${focusHours}h`}
              change={`${days}d`}
              positive
              sparklineData={focusSparkline}
            />
          </div>
          <div className="lg:col-span-1">
            <ContributionHeatmap />
          </div>
        </div>

        {/* Range selector */}
        <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-r border-border">Range</div>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                range === r
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === "custom" ? "custom" : r}
            </button>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Revenue Performance</h2>
              <p className="text-sm text-muted-foreground">
                Last {days} days · ${totalRevenue.toLocaleString()} total
              </p>
            </div>
          </div>
          <div className="h-[360px] w-full">
            {totalRevenue === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <p className="text-sm">No revenue logged yet for this range.</p>
                <p className="text-xs">Click "Add revenue" to start tracking your performance.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(days / 8))}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
