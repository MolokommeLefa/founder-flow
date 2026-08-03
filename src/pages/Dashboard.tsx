import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import TaskProgressCard from "@/components/dashboard/TaskProgressCard";
import TaskItem from "@/components/dashboard/TaskItem";
import OverallPerformance from "@/components/dashboard/OverallPerformance";
import { useTasks, DbTask } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useRevenue } from "@/hooks/useRevenue";
import { useFocusSessions } from "@/hooks/useFocusSessions";


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
  const { tasks: dbTasks, loading: tasksLoading } = useTasks();
  const { profile } = useProfile();

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

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const nickname = firstName.length > 10 ? firstName.slice(0, 10) : firstName;
  const fallbackName = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
  const userName = profile?.display_name?.trim() || fallbackName;

  const todayTasks = dbTasks.slice(0, 6);
  const completedCount = dbTasks.filter(t => t.status === "completed").length;
  const totalCount = dbTasks.length;
  const highPriorityCount = dbTasks.filter(t => t.priority === "high" && t.status !== "completed").length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={true} priorityCount={highPriorityCount} />

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <MetricCard 
            label="Monthly Revenue" 
            value="$48.2K" 
            change="+12.5%" 
            positive 
            sparklineData={[30, 25, 35, 28, 40, 38, 48]}
          />
          <TaskProgressCard
            completed={completedCount}
            total={totalCount}
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

          {/* Overall Performance */}
          <OverallPerformance tasks={dbTasks} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
