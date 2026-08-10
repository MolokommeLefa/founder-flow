import { DbTask } from "@/hooks/useTasks";

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Tasks that actually need attention today: anything due today (or overdue)
 * plus open high-priority work. Shared by the dashboard "Today's Focus" card
 * and the header "Today's priorities" overview so both stay in sync.
 */
export function getTodayFocusTasks(tasks: DbTask[], limit = 5): DbTask[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = tasks.filter((t) => t.status !== "completed");
  const dueToday = pending.filter(
    (t) => t.due_date && isSameDay(new Date(t.due_date), today)
  );
  const overdue = pending.filter(
    (t) => t.due_date && new Date(t.due_date) < today
  );
  const highPriority = pending.filter((t) => t.priority === "high");

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;

  const merged = [...new Map(
    [...overdue, ...dueToday, ...highPriority].map((t) => [t.id, t])
  ).values()];

  merged.sort((a, b) => {
    const rank = priorityRank[a.priority] - priorityRank[b.priority];
    if (rank !== 0) return rank;
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return da - db;
  });

  return merged.slice(0, limit);
}
