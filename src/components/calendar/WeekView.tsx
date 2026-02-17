import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { DbTask } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WeekViewProps {
  currentDate: Date;
  tasks: DbTask[];
  onTaskClick: (task: DbTask, e: React.MouseEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ currentDate, tasks, onTaskClick, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get current time for indicator
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimePosition = (currentHour * 60 + currentMinute) / (24 * 60) * 100;

  // Group tasks by day and hour
  const getTasksForSlot = (date: Date, hour: number) => {
    return tasks.filter(task => {
      if (!task.start_time) return false;
      const taskDate = parseISO(task.start_time);
      return isSameDay(taskDate, date) && taskDate.getHours() === hour;
    });
  };

  // Get all tasks for a day (for tasks without specific time)
  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (task.start_time) return false; // Exclude timed tasks
      if (!task.due_date) return false;
      return isSameDay(parseISO(task.due_date), date);
    });
  };

  const renderTaskBlock = (task: DbTask) => {
    const startTime = task.start_time ? parseISO(task.start_time) : null;
    const endTime = task.end_time ? parseISO(task.end_time) : null;
    
    let duration = 60; // Default 1 hour
    if (startTime && endTime) {
      duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    }

    const height = Math.max((duration / 60) * 60, 40); // min 40px height

    return (
      <Tooltip key={task.id} delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => onTaskClick(task, e)}
            className={cn(
              "absolute left-0 right-0 mx-1 px-2 py-1 rounded-md cursor-pointer transition-all hover:shadow-md hover:z-10",
              "border border-opacity-50 overflow-hidden",
              task.status === "completed" && "opacity-60"
            )}
            style={{
              backgroundColor: task.color ? `${task.color}20` : '#2563eb20',
              borderColor: task.color || '#2563eb',
              height: `${height}px`,
              top: startTime ? `${startTime.getMinutes()}px` : '2px',
            }}
          >
            <div className="text-xs font-medium truncate" style={{ color: task.color || '#2563eb' }}>
              {task.title}
            </div>
            {startTime && (
              <div className="text-xs opacity-70" style={{ color: task.color || '#2563eb' }}>
                {format(startTime, 'h:mm a')}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground">{task.description}</p>
            )}
            {startTime && endTime && (
              <p className="text-xs">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </p>
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
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
        <div className="border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-3 text-center border-r border-border",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground font-medium uppercase">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                "text-xl font-semibold mt-1",
                isToday(day) && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}
            >
              {format(day, 'd')}
            </div>
            {/* All-day tasks */}
            <div className="mt-2 space-y-1">
              {getTasksForDay(day).map(task => (
                <div
                  key={task.id}
                  onClick={(e) => onTaskClick(task, e)}
                  className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                  style={{
                    backgroundColor: `${task.color || '#2563eb'}20`,
                    borderLeft: `3px solid ${task.color || '#2563eb'}`,
                    color: task.color || '#2563eb',
                  }}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Time labels */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-border text-xs text-muted-foreground pr-2 text-right pt-1"
              >
                {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="relative border-r border-border">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={cn(
                    "h-[60px] border-b border-border hover:bg-accent/30 cursor-pointer transition-colors",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onTimeSlotClick(day, hour)}
                >
                  {/* Tasks in this hour */}
                  <div className="relative h-full">
                    {getTasksForSlot(day, hour).map(renderTaskBlock)}
                  </div>
                </div>
              ))}
              
              {/* Current time indicator */}
              {isToday(day) && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
