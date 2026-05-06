import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ContributionHeatmap from "@/components/dashboard/ContributionHeatmap";
import MetricCard from "@/components/dashboard/MetricCard";
import { useTasks } from "@/hooks/useTasks";
import { DollarSign, CheckCircle2, Clock, BarChart3 } from "lucide-react";
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

const generateRevenueSeries = (days: number) => {
  const data: { date: string; revenue: number; target: number }[] = [];
  const today = new Date();
  let val = 4000 + Math.random() * 2000;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    val += (Math.random() - 0.45) * 800;
    val = Math.max(1500, val);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.round(val),
      target: Math.round(val * 0.6 + Math.random() * 500),
    });
  }
  return data;
};

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [range, setRange] = useState<Range>(30);
  const { tasks } = useTasks();

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
  const revenueData = useMemo(() => generateRevenueSeries(days), [days]);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalTasks = tasks.length || 30;
  const focusHours = useMemo(() => Math.round(80 + Math.random() * 60), [days]);

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
        <div className="mb-6 mt-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mt-1">Track your productivity</p>
        </div>

        {/* Top row: metrics + heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon={DollarSign}
              label="Monthly Revenue"
              value={`$${(totalRevenue / 1000).toFixed(1)}k`}
              change="+8%"
              positive
              sparklineData={revenueData.slice(-12).map((d) => d.revenue)}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Tasks Done"
              value={`${completedTasks}/${totalTasks}`}
              change="+12%"
              positive
              sparklineData={[3, 5, 4, 7, 6, 8, 9, 10]}
            />
            <MetricCard
              icon={Clock}
              label="Hours Focused"
              value={`${focusHours}h`}
              change="+5%"
              positive
              sparklineData={[6, 8, 7, 9, 10, 8, 11, 12]}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
