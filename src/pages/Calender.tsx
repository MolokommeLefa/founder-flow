import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";
import { Pencil } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useTasks, type DbTask, type NewTask } from "@/hooks/useTasks";
import CalendarTaskDialog from "@/components/calendar/CalendarTaskDialog";
import TaskSidePanel from "@/components/calendar/TaskSidePanel";
import { WeekView } from "@/components/calendar/WeekView";

const Calendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentDate = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTask, setSidePanelTask] = useState<DbTask | null>(null);

  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) navigate("/auth");
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const filteredTasks = tasks;

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEndDate(null);
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    setSelectedDate(d);
    setSelectedEndDate(null);
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleTimeRangeSelect = (date: Date, startHour: number, endHour: number) => {
    const d = new Date(date);
    const sH = Math.floor(startHour);
    const sM = (startHour % 1) * 60;
    d.setHours(sH, sM, 0, 0);

    const endD = new Date(date);
    const eH = Math.floor(endHour);
    const eM = (endHour % 1) * 60;
    endD.setHours(eH, eM, 0, 0);

    setSelectedDate(d);
    setSelectedEndDate(endD);
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleTaskClick = (task: DbTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setSelectedDate(task.due_date ? parseISO(task.due_date) : null);
    setSelectedEndDate(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTask(null);
    setSelectedDate(null);
    setSelectedEndDate(null);
  };

  const handleOpenSidePanel = () => {
    if (selectedTask) {
      setSidePanelTask(selectedTask);
      setSidePanelOpen(true);
    }
  };

  const handleTaskSubmit = async (taskData: NewTask) => {
    if (selectedTask) return await updateTask(selectedTask.id, taskData);
    return await addTask(taskData);
  };


  return (
    <div className="dark dashboard-shell flex h-screen min-h-screen overflow-hidden bg-background text-foreground">
      <div className="hidden h-full shrink-0 md:block">
        <DashboardSidebar
          activeItem="Calendar"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
        {tasksLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading calendar…</div>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <WeekView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTimeSlotClick={handleTimeSlotClick}
              onTimeRangeSelect={handleTimeRangeSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Create event"
              title="Create event"
              onClick={() => handleDayClick(currentDate)}
              className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full border border-border/50 bg-background/75 text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-card hover:text-foreground active:scale-[0.97]"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
            </Button>
          </div>
        )}

        <CalendarTaskDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSubmit={handleTaskSubmit}
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          selectedTask={selectedTask}
          onOpenSidePanel={handleOpenSidePanel}
        />

        <TaskSidePanel
          open={sidePanelOpen}
          onOpenChange={setSidePanelOpen}
          task={sidePanelTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      </main>
    </div>
  );
};

export default Calendar;
