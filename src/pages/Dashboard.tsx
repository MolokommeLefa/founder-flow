import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import TaskItem from "@/components/dashboard/TaskItem";
import AssetItem from "@/components/dashboard/AssetItem";
import { useTasks, DbTask } from "@/hooks/useTasks";

const assetFiles = [
  { name: "Brand Guidelines.pdf", type: "pdf" as const, size: "2.4 MB", date: "Today" },
  { name: "Hero Video.mp4", type: "video" as const, size: "48 MB", date: "Yesterday" },
  { name: "Logo Pack.zip", type: "file" as const, size: "12 MB", date: "2 days ago" },
  { name: "Product Shots", type: "folder" as const, count: 24, date: "This week" },
];

const mapStatus = (status: DbTask["status"]): "done" | "pending" | "urgent" => {
  if (status === "completed") return "done";
  if (status === "in_progress") return "pending";
  return "urgent";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { tasks: dbTasks, loading: tasksLoading } = useTasks();

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const todayTasks = dbTasks.slice(0, 6);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} />

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <MetricCard 
            label="Monthly Revenue" 
            value="$48.2K" 
            change="+12.5%" 
            positive 
            sparklineData={[30, 25, 35, 28, 40, 38, 48]}
          />
          <MetricCard 
            icon={CheckCircle2} 
            iconClassName="text-green-500"
            label="Tasks Done" 
            value="24/32" 
            change="+8 today" 
            positive 
          />
          <MetricCard 
            icon={Clock} 
            label="Hours Saved" 
            value="18h" 
            change="this week" 
            positive 
          />
        </div>

        {/* Two column layout for Tasks and Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks section */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Today's Focus</h2>
              <button className="text-xs text-primary font-medium hover:underline">
                View all →
              </button>
            </div>
            <div className="space-y-1">
              {tasksLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading tasks...</p>
              ) : todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet. Head to Tasks to create one.</p>
              ) : (
                todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    title={task.title}
                    status={mapStatus(task.status)}
                    priority={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Assets/Files section */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Recent Files</h2>
              <button className="text-xs text-primary font-medium hover:underline">
                Browse all →
              </button>
            </div>
            <div className="space-y-1">
              {assetFiles.map((file) => (
                <AssetItem key={file.name} {...file} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
