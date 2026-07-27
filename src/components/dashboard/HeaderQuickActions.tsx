import { Bell, Clock, Play, Pause, RotateCcw, Calendar, CalendarDays, Target, Pencil } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { format, startOfWeek, startOfDay, isSameDay, isWithinInterval } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useTasks } from "@/hooks/useTasks";
import { useFocusSessions } from "@/hooks/useFocusSessions";

const DEFAULT_WEEKLY_GOAL_HOURS = 20;

const HeaderQuickActions = () => {
  const { elapsedSeconds, isRunning, toggle, reset, formattedTime } = useFocusTimer();
  const { tasks } = useTasks();
  const { sessions: focusSessions } = useFocusSessions();
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(() => {
    const saved = localStorage.getItem("weeklyFocusGoal");
    return saved ? Math.max(1, Math.min(168, Number(saved))) : DEFAULT_WEEKLY_GOAL_HOURS;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(weeklyGoalHours.toString());

  useEffect(() => {
    localStorage.setItem("weeklyFocusGoal", weeklyGoalHours.toString());
  }, [weeklyGoalHours]);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const { todaySeconds, weekSeconds } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const dayStart = startOfDay(now);

    let today = 0;
    let week = 0;

    focusSessions.forEach((session) => {
      const start = new Date(session.started_at);
      if (isSameDay(start, now)) today += session.duration_seconds;
      if (isWithinInterval(start, { start: weekStart, end: now })) week += session.duration_seconds;
    });

    if (isRunning) {
      today += elapsedSeconds;
      week += elapsedSeconds;
    }

    return { todaySeconds: today, weekSeconds: week };
  }, [focusSessions, elapsedSeconds, isRunning]);

  const { priorities, summary, hasAlert } = useMemo(() => {
    const today = new Date();
    const isSameDay = (d: Date) =>
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    const pending = tasks.filter((t) => t.status !== "completed");
    const highPriority = pending.filter((t) => t.priority === "high");
    const dueToday = pending.filter((t) => t.due_date && isSameDay(new Date(t.due_date)));

    const priorities = [...new Map(
      [...highPriority, ...dueToday].map((t) => [t.id, t])
    ).values()].slice(0, 5);

    const summary =
      priorities.length === 0
        ? "You're all caught up for today."
        : `You have ${priorities.length} ${priorities.length === 1 ? "priority" : "priorities"} scheduled${
            highPriority.length ? `, ${highPriority.length} marked high` : ""
          }.`;

    return { priorities, summary, hasAlert: priorities.length > 0 };
  }, [tasks]);

  const seconds = elapsedSeconds % 60;
  const circumference = 2 * Math.PI * 8;
  const strokeDashoffset = circumference - (seconds / 60) * circumference;

  return (
    <div className="flex items-center gap-2">
      {/* Bell — priorities & quick summary */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Priorities and reminders"
            className="relative w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary/60 flex items-center justify-center transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={1.75} />
            {hasAlert && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-foreground">Today's priorities</div>
            <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(), "EEEE, d MMM")}</div>
          </div>
          <div className="space-y-2 mb-3">
            {priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing urgent on the calendar.</p>
            ) : (
              priorities.map((t) => (
                <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40">
                  <div
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.priority === "high" ? "bg-red-500" : t.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">{t.title}</div>
                    {t.due_date && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.due_date), "h:mm a")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pt-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Quick summary</div>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clock — focus timer */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Focus timer"
            className="relative w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary/60 flex items-center justify-center transition-colors"
          >
            {isRunning ? (
              <svg width="20" height="20" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8" fill="none" stroke="hsl(145 60% 42% / 0.25)" strokeWidth="2" />
                <circle
                  cx="11" cy="11" r="8" fill="none"
                  stroke="hsl(145 60% 42%)"
                  strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 11 11)"
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
                <circle cx="11" cy="11" r="1" fill="hsl(145 60% 42%)" />
              </svg>
            ) : (
              <Clock className="w-[18px] h-[18px] text-foreground" strokeWidth={1.75} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-4">
          <div className="text-xs font-medium text-muted-foreground">Focus timer</div>
          <div className={`mt-1 font-mono text-3xl font-semibold tracking-tight ${isRunning ? "text-[hsl(145,60%,42%)]" : "text-foreground"}`}>
            {formattedTime}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isRunning ? "Focus active" : elapsedSeconds > 0 ? "Timer paused" : "Ready when you are"}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={toggle}
              className="flex-1 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
            </button>
            <button
              onClick={reset}
              className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary/60 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Focus summary */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Today
              </div>
              <div className="text-lg font-semibold text-foreground">{formatDuration(todaySeconds)}</div>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <CalendarDays className="w-3.5 h-3.5" />
                This week
              </div>
              <div className="text-lg font-semibold text-foreground">{formatDuration(weekSeconds)}</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default HeaderQuickActions;
