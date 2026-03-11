import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { DbTask } from "@/hooks/useTasks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef, useEffect, useState, useCallback } from "react";

interface WeekViewProps {
  currentDate: Date;
  tasks: DbTask[];
  onTaskClick: (task: DbTask, e: React.MouseEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const VISIBLE_START = 7;
const SLOT_HEIGHT = 60; // px per hour
const HALF_SLOT = 30; // px per 30 min

interface DragState {
  day: Date;
  startSlot: number; // in half-hour increments
  currentSlot: number;
}

export function WeekView({ currentDate, tasks, onTaskClick, onTimeSlotClick, onTimeRangeSelect }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [drag, setDrag] = useState<DragState | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = VISIBLE_START * SLOT_HEIGHT;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  const getAllDayTasks = (date: Date) =>
    tasks.filter(t => !t.start_time && t.due_date && isSameDay(parseISO(t.due_date), date));

  const getTimedTasks = (date: Date) =>
    tasks.filter(t => t.start_time && isSameDay(parseISO(t.start_time), date));

  // Convert mouse Y position to half-hour slot
  const getSlotFromY = useCallback((y: number, containerTop: number): number => {
    const relativeY = y - containerTop;
    return Math.max(0, Math.min(47, Math.floor(relativeY / HALF_SLOT)));
  }, []);

  const handleMouseDown = useCallback((day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    // Don't start drag on task clicks
    if ((e.target as HTMLElement).closest('[data-task-block]')) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const slot = getSlotFromY(e.clientY, rect.top);

    draggingRef.current = true;
    setDrag({ day, startSlot: slot, currentSlot: slot });

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const newRect = container.getBoundingClientRect();
      const currentSlot = getSlotFromY(ev.clientY, newRect.top);
      setDrag(prev => prev ? { ...prev, currentSlot } : null);
    };

    const handleMouseUp = (ev: MouseEvent) => {
      draggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      setDrag(prev => {
        if (!prev) return null;
        const minSlot = Math.min(prev.startSlot, prev.currentSlot);
        const maxSlot = Math.max(prev.startSlot, prev.currentSlot);

        // If it's just a click (no drag), use the old single-slot behavior
        if (minSlot === maxSlot) {
          const hour = Math.floor(minSlot / 2);
          onTimeSlotClick(day, hour);
        } else if (onTimeRangeSelect) {
          const startHourDecimal = minSlot / 2;
          const endHourDecimal = (maxSlot + 1) / 2;
          onTimeRangeSelect(day, startHourDecimal, endHourDecimal);
        }
        return null;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getSlotFromY, onTimeSlotClick, onTimeRangeSelect]);

  // Get drag selection rectangle for a given day
  const getDragSelection = (day: Date) => {
    if (!drag || !isSameDay(drag.day, day)) return null;
    const minSlot = Math.min(drag.startSlot, drag.currentSlot);
    const maxSlot = Math.max(drag.startSlot, drag.currentSlot);
    const top = minSlot * HALF_SLOT;
    const height = (maxSlot - minSlot + 1) * HALF_SLOT;
    const startH = minSlot / 2;
    const endH = (maxSlot + 1) / 2;
    return { top, height, startH, endH };
  };

  const formatHourLabel = (h: number) => {
    const hour = Math.floor(h);
    const min = (h % 1) * 60;
    const d = new Date(2000, 0, 1, hour, min);
    return format(d, 'h:mm a');
  };

  const renderTaskBlock = (task: DbTask) => {
    const start = task.start_time ? parseISO(task.start_time) : null;
    const end = task.end_time ? parseISO(task.end_time) : null;
    if (!start) return null;

    let durationMin = 60;
    if (end) durationMin = (end.getTime() - start.getTime()) / 60000;

    const topPx = start.getHours() * SLOT_HEIGHT + start.getMinutes();
    const heightPx = Math.max((durationMin / 60) * SLOT_HEIGHT, 30);
    const color = task.color || '#2563eb';

    return (
      <Tooltip key={task.id} delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            data-task-block
            onClick={(e) => onTaskClick(task, e)}
            className={cn(
              "absolute left-1 right-1 rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg overflow-hidden z-10",
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
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
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
          {/* Time labels */}
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
          {weekDays.map((day) => {
            const selection = getDragSelection(day);

            return (
              <div
                key={day.toISOString()}
                className="relative border-r border-border/50 last:border-r-0 select-none"
                onMouseDown={(e) => handleMouseDown(day, e)}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      "h-[60px] border-b border-border/50",
                      isToday(day) && "bg-primary/[0.02]"
                    )}
                  />
                ))}

                {/* Drag selection overlay */}
                {selection && (
                  <div
                    className="absolute left-1 right-1 rounded-lg border-2 border-primary bg-primary/15 z-20 pointer-events-none transition-[top,height] duration-75"
                    style={{ top: `${selection.top}px`, height: `${selection.height}px` }}
                  >
                    <div className="px-2 py-1 text-xs font-medium text-primary">
                      {formatHourLabel(selection.startH)} – {formatHourLabel(selection.endH)}
                    </div>
                  </div>
                )}

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
                    style={{ top: `${currentHour * SLOT_HEIGHT + currentMinute}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
                      <div className="flex-1 h-[2px] bg-destructive" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
