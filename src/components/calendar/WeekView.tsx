import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { DbTask } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef, useEffect, useState } from "react";

interface WeekViewProps {
  currentDate: Date;
  tasks: DbTask[];
  onTaskClick: (task: DbTask, e: React.MouseEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const VISIBLE_START = 7; // Start scrolled to 7 AM

export function WeekView({ currentDate, tasks, onTaskClick, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-scroll to working hours on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = VISIBLE_START * 60;
    }
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // All-day tasks (no start_time)
  const getAllDayTasks = (date: Date) =>
    tasks.filter(t => !t.start_time && t.due_date && isSameDay(parseISO(t.due_date), date));

  // Timed tasks
  const getTimedTasks = (date: Date) =>
    tasks.filter(t => t.start_time && isSameDay(parseISO(t.start_time), date));

  const renderTaskBlock = (task: DbTask) => {
    const start = task.start_time ? parseISO(task.start_time) : null;
    const end = task.end_time ? parseISO(task.end_time) : null;
    if (!start) return null;

    let durationMin = 60;
    if (end) durationMin = (end.getTime() - start.getTime()) / 60000;

    const topPx = start.getHours() * 60 + start.getMinutes();
    const heightPx = Math.max((durationMin / 60) * 60, 30);
    const color = task.color || '#2563eb';

    return (
      <Tooltip key={task.id} delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => onTaskClick(task, e)}
            className={cn(
              "absolute left-1 right-1 rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg overflow-hidden",
              task.status === "completed" && "opacity-50"
            )}
            style={{
              backgroundColor: `${color}40`,
              top: `${topPx}px`,
              height: `${heightPx}px`,
              minHeight: '30px',
            }}
          >
            <div className="px-2 py-1 h-full flex flex-col justify-start">
              <div className="text-xs font-semibold truncate" style={{ color }}>
                {task.title}
              </div>
              <div className="text-[10px] opacity-80" style={{ color }}>
                {format(start, 'h')}-{end ? format(end, 'h a') : format(new Date(start.getTime() + 3600000), 'h a')}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold">{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
          {start && end && <p className="text-xs">{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</p>}
          <p className="text-xs capitalize">{task.priority} priority · {task.status.replace("_", " ")}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const hasAllDayTasks = weekDays.some(d => getAllDayTasks(d).length > 0);

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background">
      {/* Sticky header: day names + all-day row */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div className="border-r border-border" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "py-3 text-center border-r border-border last:border-r-0",
                isToday(day) && "bg-primary/5"
              )}
            >
              <span className="text-sm font-medium text-muted-foreground">
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                "ml-2 text-sm font-semibold",
                isToday(day)
                  ? "bg-primary text-primary-foreground rounded-full inline-flex items-center justify-center w-6 h-6"
                  : "text-foreground"
              )}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>

        {/* All-day row */}
        {hasAllDayTasks && (
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-border">
            <div className="border-r border-border flex items-center justify-end pr-2">
              <span className="text-[10px] text-muted-foreground">All-Day</span>
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[28px] py-1 px-1 border-r border-border last:border-r-0 flex flex-wrap gap-1",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {getAllDayTasks(day).map(task => (
                  <div
                    key={task.id}
                    onClick={(e) => onTaskClick(task, e)}
                    className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer max-w-full"
                    style={{
                      backgroundColor: `${task.color || '#2563eb'}30`,
                      color: task.color || '#2563eb',
                    }}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] relative">
          {/* Time labels column */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-border/50 text-[11px] text-muted-foreground text-right pr-2 pt-0"
              >
                {hour === 0 ? '' : format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="relative border-r border-border/50 last:border-r-0">
              {/* Hour slots */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={cn(
                    "h-[60px] border-b border-border/50 hover:bg-accent/20 cursor-pointer transition-colors",
                    isToday(day) && "bg-primary/[0.02]"
                  )}
                  onClick={() => onTimeSlotClick(day, hour)}
                />
              ))}

              {/* Task blocks */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full pointer-events-auto">
                  {getTimedTasks(day).map(renderTaskBlock)}
                </div>
              </div>

              {/* Current time indicator */}
              {isToday(day) && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${currentHour * 60 + currentMinute}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
                    <div className="flex-1 h-[2px] bg-destructive" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
