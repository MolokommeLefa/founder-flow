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
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTasks, type DbTask, type NewTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import TaskDialog from "@/components/dashboard/TaskDialog";
import { WeekView } from "@/components/calendar/WeekView";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";

type ViewMode = "month" | "week";

const Calendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

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

  // Filter tasks by month
  const monthTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDate = parseISO(task.due_date);
    return (
      taskDate >= monthStart &&
      taskDate <= monthEnd &&
      (showCompleted || task.status !== "completed")
    );
  });

  // Group tasks by date
  const tasksByDate = monthTasks.reduce((acc, task) => {
    if (!task.due_date) return acc;
    const dateKey = format(parseISO(task.due_date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, DbTask[]>);

  const getPriorityColor = (priority: DbTask["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hour, 0, 0, 0);
    setSelectedDate(selectedDateTime);
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleTaskClick = (task: DbTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setSelectedDate(task.due_date ? parseISO(task.due_date) : null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTask(null);
    setSelectedDate(null);
  };

  const handleTaskSubmit = async (taskData: NewTask) => {
    if (selectedTask) {
      return await updateTask(selectedTask.id, taskData);
    } else {
      return await addTask(taskData);
    }
  };

  const renderDayCell = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTasks = tasksByDate[dateKey] || [];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isCurrentDay = isToday(day);
    const maxVisibleTasks = 3;
    const visibleTasks = dayTasks.slice(0, maxVisibleTasks);
    const hiddenTasksCount = dayTasks.length - maxVisibleTasks;

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "min-h-[120px] border border-border bg-card p-2 cursor-pointer transition-colors hover:bg-accent/50",
          !isCurrentMonth && "bg-muted/30 text-muted-foreground",
          isCurrentDay && "ring-2 ring-primary"
        )}
        onClick={() => handleDayClick(day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium",
              isCurrentDay && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
            )}
          >
            {format(day, "d")}
          </span>
          {dayTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {dayTasks.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {visibleTasks.map((task) => (
            <Tooltip key={task.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  onClick={(e) => handleTaskClick(task, e)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md border-l-4 truncate cursor-pointer hover:shadow-sm transition-all",
                    task.status === "completed" && "line-through opacity-60"
                  )}
                  style={{ 
                    backgroundColor: task.color ? `${task.color}20` : '#2563eb20',
                    borderLeftColor: task.color || '#2563eb',
                    color: task.color || '#2563eb',
                  }}
                >
                  {task.title}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("capitalize", task.status === "completed" && "line-through")}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{task.priority} priority</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {hiddenTasksCount > 0 && (
            <div className="text-xs text-muted-foreground px-2">
              +{hiddenTasksCount} more
            </div>
          )}
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
        <DashboardHeader userName={userName} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Calendar</h1>
          <p className="text-muted-foreground">Manage your schedule and tasks</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar with Mini Calendar */}
          <div className="hidden lg:block w-64 space-y-4">
            <MiniCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setSelectedDate(date);
              }}
              onMonthChange={setCurrentDate}
            />
          </div>

          {/* Main Calendar */}
          <div className="flex-1 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousMonth}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === "month" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                    className="h-8"
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === "week" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className="h-8"
                  >
                    Week
                  </Button>
                </div>
                <Button variant="outline" onClick={handleToday}>
                  Today
                </Button>
                <Button
                  variant={showCompleted ? "secondary" : "outline"}
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? "Hide" : "Show"} Completed
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setSelectedTask(null);
                    setDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Calendar Content */}
            {tasksLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
              </div>
            ) : viewMode === "week" ? (
              <div className="h-[600px]">
                <WeekView
                  currentDate={currentDate}
                  tasks={tasks.filter(t => showCompleted || t.status !== "completed")}
                  onTaskClick={handleTaskClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              </div>
            ) : (
              <div>
                {/* Week day labels */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => renderDayCell(day))}
                </div>
              </div>
            )}
          </div>
        </div>

        <TaskDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSubmit={handleTaskSubmit}
          selectedDate={selectedDate}
          selectedTask={selectedTask}
        />
      </main>
    </div>
  );
};

export default Calendar;
