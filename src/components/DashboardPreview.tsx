import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart4,
  Folder,
  Zap,
  LayoutDashboard,
  Settings,
  Search,
  Library,
  StickyNote,
  SquarePen,
  UserRound,
  Inbox,
  Bell,
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SparklineChart from "@/components/dashboard/SparklineChart";
import CircularProgress from "@/components/dashboard/CircularProgress";

const sidebarApps: Array<{ icon: React.ElementType; name: string; active?: boolean; dot?: boolean }> = [
  { icon: LayoutDashboard, name: "Dashboard", active: true },
  { icon: SquarePen, name: "Tasks", dot: true },
  { icon: Calendar, name: "Calendar" },
  { icon: Folder, name: "Projects" },
  { icon: Library, name: "Media Library" },
  { icon: StickyNote, name: "Documents" },
  { icon: UserRound, name: "Team" },
  { icon: BarChart4, name: "Analytics" },
  { icon: Inbox, name: "Inbox", dot: true },
  { icon: Zap, name: "Automations" },
];

const SidebarItem = ({
  icon: Icon,
  name,
  active = false,
  dot,
}: {
  icon: React.ElementType;
  name: string;
  active?: boolean;
  dot?: boolean;
}) => (
  <div
    className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
      active
        ? "bg-secondary/60 text-foreground"
        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
    }`}
  >
    <Icon className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
    <span className="text-sm font-medium flex-1">{name}</span>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
  </div>
);

const MetricCard = ({
  icon: Icon,
  label,
  value,
  change,
  positive,
  sparklineData,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  sparklineData?: number[];
}) => (
  <div className="p-5 rounded-xl bg-card border border-border">
    <div className="flex items-center justify-between mb-3">
      {Icon ? <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /> : <div />}
      <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>{change}</span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      {sparklineData && <SparklineChart data={sparklineData} positive={positive} />}
    </div>
  </div>
);

const TaskProgressCard = ({ completed, total }: { completed: number; total: number }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <CircularProgress value={percentage} size={44} strokeWidth={4} />
        <span className="text-xs font-medium text-green-500">{percentage}% complete</span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground">
          {completed}
          <span className="text-muted-foreground font-normal">/{total}</span>
        </div>
        <div className="text-sm text-muted-foreground">Tasks done</div>
      </div>
    </div>
  );
};

const TaskItem = ({ title, status, priority }: { title: string; status: "done" | "pending" | "urgent"; priority: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
    {status === "done" ? (
      <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
    ) : status === "urgent" ? (
      <AlertCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
    )}
    <span className={`flex-1 text-sm ${status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
      {title}
    </span>
    <span className="text-xs text-muted-foreground">{priority}</span>
  </div>
);

const PerformanceLegendIcon = ({ color }: { color: string }) => (
  <div className={`w-3 h-3 rounded-full ${color}`} />
);

const OverallPerformancePreview = () => {
  const size = 160;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const onTrack = 18;
  const atRisk = 4;
  const offTrack = 2;
  const total = onTrack + atRisk + offTrack;
  const a1 = (onTrack / total) * circumference;
  const a2 = (atRisk / total) * circumference;
  const a3 = (offTrack / total) * circumference;
  const percentage = Math.round((onTrack / total) * 1000) / 10;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-foreground">Overall Performance</h4>
        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Projects →</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <PerformanceLegendIcon color="bg-green-600" />
            <span className="text-sm text-muted-foreground">{onTrack} On Track</span>
          </div>
          <div className="flex items-center gap-2.5">
            <PerformanceLegendIcon color="bg-yellow-600" />
            <span className="text-sm text-muted-foreground">{atRisk} At Risk</span>
          </div>
          <div className="flex items-center gap-2.5">
            <PerformanceLegendIcon color="bg-red-600" />
            <span className="text-sm text-muted-foreground">{offTrack} Off Track</span>
          </div>
        </div>
        <div className="relative flex-1 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#22c55e" strokeWidth={strokeWidth}
              strokeDasharray={`${a1} ${circumference - a1}`} strokeLinecap="round" />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eab308" strokeWidth={strokeWidth}
              strokeDasharray={`${a2} ${circumference - a2}`} strokeDashoffset={-a1} strokeLinecap="round" />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
              strokeDasharray={`${a3} ${circumference - a3}`} strokeDashoffset={-(a1 + a2)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-[500] text-foreground">{percentage}%</span>
            <span className="text-xs font-[500] text-muted-foreground">healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPreview = () => {
  return (
    <section id="dashboard" className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything at a <span className="text-gradient">glance.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your personalized command center. See what matters, act on what's important.
          </p>
        </ScrollReveal>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                    app.founderos.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard layout with sidebar */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-52 border-r border-border bg-secondary/30 p-3 hidden md:block">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border mb-4">
                    <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm text-muted-foreground">Search...</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</span>
                  </div>

                  <div className="space-y-1">
                    {sidebarApps.map((app) => (
                      <SidebarItem key={app.name} icon={app.icon} name={app.name} active={app.active} dot={app.dot} />
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <SidebarItem icon={Settings} name="Settings" />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Good morning, Alex</h3>
                      <p className="text-muted-foreground">You have 3 priorities for today</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center">
                        <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center">
                        <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <MetricCard
                      label="Monthly Revenue"
                      value="$48.2K"
                      change="+12.5%"
                      positive
                      sparklineData={[8, 12, 11, 18, 22, 30, 42]}
                    />
                    <TaskProgressCard completed={24} total={32} />
                    <MetricCard icon={Clock} label="Hours Focused" value="18.4h" change="this week" positive />
                  </div>

                  {/* Two column layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Tasks section */}
                    <div className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground">Today's Focus</h4>
                          <p className="text-xs text-muted-foreground">4 tasks need your attention today</p>
                        </div>
                        <span className="text-xs text-primary font-medium cursor-pointer hover:underline">View all →</span>
                      </div>
                      <div className="space-y-1">
                        <TaskItem title="Finalize brand guidelines" status="urgent" priority="High" />
                        <TaskItem title="Review client feedback" status="pending" priority="High" />
                        <TaskItem title="Export final renders" status="pending" priority="Medium" />
                        <TaskItem title="Team creative sync" status="done" priority="Medium" />
                      </div>
                    </div>

                    {/* Overall performance */}
                    <OverallPerformancePreview />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
