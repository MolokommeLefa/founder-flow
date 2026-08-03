import { useMemo, useRef, useState, useCallback } from "react";
import { DbProject } from "@/hooks/useProjects";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, eachWeekOfInterval, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GanttTimelineProps {
  projects: DbProject[];
  rootProjects: DbProject[];
  getSubProjects: (parentId: string) => DbProject[];
  onUpdateProject: (id: string, updates: Partial<any>) => Promise<boolean>;
  onDeleteProject: (id: string) => Promise<boolean>;
  onAddSubProject: (parentId: string) => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  on_track: (
    <div className="w-3.5 h-3.5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
      <svg width="8" height="6" viewBox="0 0 18 12" fill="none"><path d="M1 6C3 3 5 1.5 7 4C9 6.5 11 9 13 6C15 3 17 1 17 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  ),
  at_risk: (
    <div className="w-3.5 h-3.5 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
      <svg width="8" height="6" viewBox="0 0 18 12" fill="none"><path d="M1 6L5 2L9 8L13 4L17 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  ),
  off_track: (
    <div className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
      <svg width="8" height="6" viewBox="0 0 18 12" fill="none"><path d="M1 2L5 8L9 4L13 10L17 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  ),
};

const DAY_WIDTH = 18;
const ROW_HEIGHT = 80;
const HEADER_HEIGHT = 50;

const GanttTimeline = ({ projects, rootProjects, getSubProjects, onUpdateProject, onDeleteProject, onAddSubProject }: GanttTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; type: "move" | "resize-end"; startX: number; origStart: string; origEnd: string } | null>(null);

  // Calculate timeline range
  const { timelineStart, timelineEnd, months, totalDays } = useMemo(() => {
    if (projects.length === 0) return { timelineStart: new Date(), timelineEnd: new Date(), months: [], totalDays: 0 };

    const allDates = projects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]);
    const min = new Date(Math.min(...allDates.map(d => d.getTime())));
    const max = new Date(Math.max(...allDates.map(d => d.getTime())));

    const tStart = startOfMonth(addDays(min, -14));
    const tEnd = endOfMonth(addDays(max, 30));
    const months = eachMonthOfInterval({ start: tStart, end: tEnd });
    const totalDays = differenceInDays(tEnd, tStart);

    return { timelineStart: tStart, timelineEnd: tEnd, months, totalDays };
  }, [projects]);

  // Flatten project rows: root + children
  const rows = useMemo(() => {
    const result: { project: DbProject; isChild: boolean; parentIndex: number }[] = [];
    rootProjects.forEach((rp, idx) => {
      result.push({ project: rp, isChild: false, parentIndex: -1 });
      const parentIdx = result.length - 1;
      getSubProjects(rp.id).forEach(sp => {
        result.push({ project: sp, isChild: true, parentIndex: parentIdx });
      });
    });
    return result;
  }, [rootProjects, getSubProjects]);

  const getBarProps = useCallback((project: DbProject) => {
    const start = differenceInDays(new Date(project.start_date), timelineStart);
    const duration = differenceInDays(new Date(project.end_date), new Date(project.start_date));
    return { left: start * DAY_WIDTH, width: Math.max(duration * DAY_WIDTH, 40) };
  }, [timelineStart]);

  const handleMouseDown = (e: React.MouseEvent, project: DbProject, type: "move" | "resize-end") => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ id: project.id, type, startX: e.clientX, origStart: project.start_date, origEnd: project.end_date });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const daysDelta = Math.round(dx / DAY_WIDTH);
    if (daysDelta === 0) return;

    const origStart = new Date(dragging.origStart);
    const origEnd = new Date(dragging.origEnd);

    if (dragging.type === "move") {
      const newStart = format(addDays(origStart, daysDelta), "yyyy-MM-dd");
      const newEnd = format(addDays(origEnd, daysDelta), "yyyy-MM-dd");
      onUpdateProject(dragging.id, { start_date: newStart, end_date: newEnd });
    } else {
      const newEnd = addDays(origEnd, daysDelta);
      if (newEnd > origStart) {
        onUpdateProject(dragging.id, { end_date: format(newEnd, "yyyy-MM-dd") });
      }
    }
  }, [dragging, onUpdateProject]);

  const handleMouseUp = () => setDragging(null);

  const totalWidth = totalDays * DAY_WIDTH;

  // Today marker position (null when outside the visible range)
  const todayX = useMemo(() => {
    const today = new Date();
    if (today < timelineStart || today > timelineEnd) return null;
    const days = differenceInDays(today, timelineStart) + (today.getHours() / 24);
    return days * DAY_WIDTH;
  }, [timelineStart, timelineEnd]);


  // Calculate connection lines between parent and child
  const connectionLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; cx: number; cy: number }[] = [];
    rows.forEach((row, idx) => {
      if (row.isChild && row.parentIndex >= 0) {
        const parent = rows[row.parentIndex].project;
        const child = row.project;
        const parentBar = getBarProps(parent);
        const childBar = getBarProps(child);

        const x1 = parentBar.left + parentBar.width;
        const y1 = HEADER_HEIGHT + row.parentIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = childBar.left;
        const y2 = HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;

        const cx = x1 + (x2 - x1) * 0.5;
        const cy = y2;

        lines.push({ x1, y1, x2, y2, cx, cy });
      }
    });
    return lines;
  }, [rows, getBarProps]);

  if (projects.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-border bg-card overflow-auto relative select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ maxHeight: "70vh" }}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: HEADER_HEIGHT + rows.length * ROW_HEIGHT }}>
        {/* Month headers */}
        <div className="sticky top-0 z-20 bg-card border-b border-border flex" style={{ height: HEADER_HEIGHT }}>
          {months.map((month, i) => {
            const monthStart = differenceInDays(month, timelineStart);
            const nextMonth = i < months.length - 1 ? months[i + 1] : timelineEnd;
            const monthDays = differenceInDays(nextMonth, month);

            return (
              <div
                key={month.toISOString()}
                className="border-r border-border/50 flex flex-col justify-center px-3"
                style={{ width: monthDays * DAY_WIDTH, minWidth: monthDays * DAY_WIDTH }}
              >
                <span className="text-xs font-medium text-foreground">{format(month, "MMM")}</span>
                <div className="flex gap-0">
                  {Array.from({ length: Math.floor(monthDays / 7) + 1 }, (_, w) => {
                    const weekNum = differenceInDays(addDays(month, w * 7), timelineStart);
                    return (
                      <span key={w} className="text-[10px] text-muted-foreground" style={{ width: 7 * DAY_WIDTH }}>
                        {addDays(month, w * 7).getDate()}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0" style={{ top: HEADER_HEIGHT }}>
          {months.map(month => {
            const x = differenceInDays(month, timelineStart) * DAY_WIDTH;
            return <div key={month.toISOString()} className="absolute top-0 bottom-0 border-l border-dashed border-border/40" style={{ left: x }} />;
          })}
        </div>

        {/* Connection lines (SVG) */}
        <svg className="absolute inset-0 pointer-events-none" style={{ top: 0, left: 0, width: totalWidth, height: HEADER_HEIGHT + rows.length * ROW_HEIGHT }}>
          {connectionLines.map((line, i) => (
            <path
              key={i}
              d={`M ${line.x1} ${line.y1} C ${line.cx} ${line.y1}, ${line.cx} ${line.y2}, ${line.x2} ${line.y2}`}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
          ))}
        </svg>

        {/* Project bars */}
        {rows.map((row, idx) => {
          const { project, isChild } = row;
          const bar = getBarProps(project);
          const topOffset = HEADER_HEIGHT + idx * ROW_HEIGHT;

          return (
            <div
              key={project.id}
              className="absolute group"
              style={{ top: topOffset, left: 0, height: ROW_HEIGHT, width: totalWidth }}
            >
              {/* Row hover background */}
              <div className="absolute inset-0 group-hover:bg-muted/20 transition-colors" />

              {/* Label */}
              <div
                className="absolute flex items-center gap-1.5 z-10"
                style={{ left: bar.left, top: 4, maxWidth: bar.width }}
              >
                <span className={cn("text-xs font-medium text-foreground truncate", isChild && "ml-4")}>
                  {project.title}
                </span>
                {STATUS_ICONS[project.status]}
              </div>

              {/* Bar */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "absolute rounded-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg",
                      dragging?.id === project.id && "opacity-70"
                    )}
                    style={{
                      left: bar.left,
                      top: 24,
                      width: bar.width,
                      height: 28,
                    }}
                    onMouseDown={e => handleMouseDown(e, project, "move")}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{ backgroundColor: project.color, opacity: 0.85 }}
                    />
                    {/* Remaining portion (lighter) */}
                    <div
                      className="absolute top-0 right-0 bottom-0 rounded-r-md bg-muted/40"
                      style={{ width: `${Math.max(0, 100 - (project.progress || 0))}%` }}
                    />

                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-foreground/20 rounded-r-md"
                      onMouseDown={e => handleMouseDown(e, project, "resize-end")}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-muted-foreground">{format(new Date(project.start_date), "MMM d")} – {format(new Date(project.end_date), "MMM d, yyyy")}</div>
                  <div className="text-muted-foreground capitalize">{project.status.replace("_", " ")}</div>
                </TooltipContent>
              </Tooltip>

              {/* Context menu */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ left: bar.left + bar.width + 8, top: 24 }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {!isChild && (
                      <DropdownMenuItem onClick={() => onAddSubProject(project.id)}>
                        <ChevronRight className="w-3.5 h-3.5 mr-2" /> Add Sub-project
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttTimeline;
