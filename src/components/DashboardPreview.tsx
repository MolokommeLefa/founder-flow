import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  CheckSquare,
  Calendar,
  Wallet,
  Users,
  BarChart3,
  FolderOpen,
  MessageSquare,
  Zap,
  LayoutDashboard,
  Settings,
  Search
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const sidebarApps = [
  { icon: LayoutDashboard, name: "Dashboard", active: true },
  { icon: CheckSquare, name: "Tasks", badge: 3 },
  { icon: Calendar, name: "Calendar" },
  { icon: Wallet, name: "Finance" },
  { icon: Users, name: "Team" },
  { icon: BarChart3, name: "Analytics" },
  { icon: FolderOpen, name: "Documents" },
  { icon: MessageSquare, name: "Inbox", badge: 12 },
  { icon: Zap, name: "Automations" },
];

const SidebarItem = ({ 
  icon: Icon, 
  name, 
  active = false, 
  badge 
}: { 
  icon: React.ElementType; 
  name: string; 
  active?: boolean;
  badge?: number;
}) => (
  <div 
    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
      active 
        ? 'bg-primary/10 text-primary' 
        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium flex-1">{name}</span>
    {badge && (
      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const MetricCard = ({
  icon: Icon, 
  label, 
  value, 
  change, 
  positive 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) => (
  <div className="p-5 rounded-xl bg-card border border-border">
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {change}
      </span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const TaskItem = ({ title, status, priority }: { title: string; status: 'done' | 'pending' | 'urgent'; priority: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
    {status === 'done' ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : status === 'urgent' ? (
      <AlertCircle className="w-5 h-5 text-primary" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
    )}
    <span className={`flex-1 text-sm ${status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
      {title}
    </span>
    <span className="text-xs text-muted-foreground">{priority}</span>
  </div>
);

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
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Search...</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</span>
                </div>
                
                {/* Apps */}
                <div className="space-y-1">
                  {sidebarApps.map((app) => (
                    <SidebarItem 
                      key={app.name} 
                      icon={app.icon} 
                      name={app.name} 
                      active={app.active}
                      badge={app.badge}
                    />
                  ))}
                </div>
                
                {/* Settings at bottom */}
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Focus time: 4h 32m</span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <MetricCard icon={TrendingUp} label="Monthly Revenue" value="$48.2K" change="+12.5%" positive />
                  <MetricCard icon={CheckCircle2} label="Tasks Done" value="24/32" change="+8 today" positive />
                  <MetricCard icon={Clock} label="Hours Saved" value="18h" change="this week" positive />
                  <MetricCard icon={AlertCircle} label="Pending Items" value="5" change="-3 from yesterday" positive />
                </div>

                {/* Tasks section */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground">Today's Focus</h4>
                    <span className="text-xs text-primary font-medium">View all →</span>
                  </div>
                  <div className="space-y-1">
                    <TaskItem title="Review Q4 financial projections" status="urgent" priority="High" />
                    <TaskItem title="Call with potential investor" status="pending" priority="High" />
                    <TaskItem title="Approve new hire onboarding" status="pending" priority="Medium" />
                    <TaskItem title="Weekly team sync" status="done" priority="Medium" />
                    <TaskItem title="Update product roadmap" status="done" priority="Low" />
                  </div>
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
