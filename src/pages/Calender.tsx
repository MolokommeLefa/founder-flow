import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTasks, type DbTask, type NewTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import CalendarTaskDialog from "@/components/calendar/CalendarTaskDialog";
import TaskSidePanel from "@/components/calendar/TaskSidePanel";
import { WeekView } from "@/components/calendar/WeekView";

type ViewMode = "month" | "week";

const Calendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTask, setSidePanelTask] = useState<DbTask | null>(null);

  const { tasks, loading: tasksLoading, addTask, updateTask } = useTasks();

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filter tasks
  const filteredTasks = tasks.filter(t => showCompleted || t.status !== "completed");

  const monthTasks = filteredTasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDate = parseISO(task.due_date);
    return taskDate >= monthStart && taskDate <= monthEnd;
  });

  const tasksByDate = monthTasks.reduce((acc, task) => {
    if (!task.due_date) return acc;
    const dateKey = format(parseISO(task.due_date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, DbTask[]>);

  const handlePrev = () => {
    setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

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

  const handleTaskSubmit = async (taskData: NewTask) => {
    if (selectedTask) return await updateTask(selectedTask.id, taskData);
    return await addTask(taskData);
  };

  const renderDayCell = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTasks = tasksByDate[dateKey] || [];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);
    const maxVisible = 3;
    const visible = dayTasks.slice(0, maxVisible);
    const hidden = dayTasks.length - maxVisible;

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "min-h-[120px] border border-border p-2 cursor-pointer transition-colors hover:bg-accent/30",
          !isCurrentMonth && "opacity-40",
          isCurrentDay && "ring-1 ring-primary"
        )}
        onClick={() => handleDayClick(day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm",
              isCurrentDay && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold"
            )}
          >
            {format(day, "d")}
          </span>
          {dayTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{dayTasks.length}</Badge>
          )}
        </div>
        <div className="space-y-1">
          {visible.map((task) => (
            <div
              key={task.id}
              onClick={(e) => handleTaskClick(task, e)}
              className={cn(
                "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer border-l-2",
                task.status === "completed" && "line-through opacity-60"
              )}
              style={{
                backgroundColor: `${task.color || '#2563eb'}15`,
                borderLeftColor: task.color || '#2563eb',
                color: task.color || '#2563eb',
              }}
            >
              {task.title}
            </div>
          ))}
          {hidden > 0 && <div className="text-xs text-muted-foreground px-1.5">+{hidden} more</div>}
        </div>
      </div>
    );
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar
          activeItem="Calendar"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        {/* Title + subtitle */}
        <div className="mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
            <Pencil className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mt-1">Manage your schedule and tasks</p>
        </div>

        {/* Month heading + segmented control inline */}
        <div className="flex items-center gap-4 mb-4 mt-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold text-foreground min-w-[180px]">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Segmented control */}
          <div className="flex items-center border border-border rounded-lg p-0.5 gap-0">
            {(["week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-4 py-1 rounded-md text-sm font-medium transition-all capitalize",
                  viewMode === mode
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
            <button
              onClick={handleToday}
              className="px-4 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
          </div>
        ) : viewMode === "week" ? (
          <div className="h-[calc(100vh-220px)]">
            <WeekView
              currentDate={currentDate}
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTimeSlotClick={handleTimeSlotClick}
              onTimeRangeSelect={handleTimeRangeSelect}
            />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-3 border-b border-border">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => renderDayCell(day))}
            </div>
          </div>
        )}

        <CalendarTaskDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSubmit={handleTaskSubmit}
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          selectedTask={selectedTask}
        />
      </main>
    </div>
  );
};

export default Calendar;
