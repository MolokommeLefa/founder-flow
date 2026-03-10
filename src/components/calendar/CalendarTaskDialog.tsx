import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { X, MoreHorizontal, Copy, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { NewTask, DbTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

interface CalendarTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: NewTask) => Promise<boolean>;
  selectedDate?: Date | null;
  selectedTask?: DbTask | null;
}

const PRESET_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#ca8a04", // yellow
  "#ec4899", // pink
  "#16a34a", // green
];

const CalendarTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedDate,
  selectedTask,
}: CalendarTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("1:00 PM");
  const [endTime, setEndTime] = useState("4:00 PM");
  const [color, setColor] = useState("#2563eb");
  const [reminders, setReminders] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setColor(selectedTask.color || "#2563eb");
      if (selectedTask.start_time) {
        const s = new Date(selectedTask.start_time);
        setStartTime(format(s, "h:mm a"));
      }
      if (selectedTask.end_time) {
        const e = new Date(selectedTask.end_time);
        setEndTime(format(e, "h:mm a"));
      }
    } else {
      resetForm();
      if (selectedDate) {
        const h = selectedDate.getHours();
        if (h > 0) {
          setStartTime(format(selectedDate, "h:mm a"));
          const end = new Date(selectedDate);
          end.setHours(h + 3);
          setEndTime(format(end, "h:mm a"));
        }
      }
    }
  }, [selectedTask, selectedDate, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("1:00 PM");
    setEndTime("4:00 PM");
    setColor("#2563eb");
    setReminders("");
  };

  const parseTimeToDate = (timeStr: string, baseDate: Date): Date | null => {
    const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || "0");
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    const baseDate = selectedDate || new Date();
    const parsedStart = parseTimeToDate(startTime, baseDate);
    const parsedEnd = parseTimeToDate(endTime, baseDate);

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status: selectedTask?.status || "not_started",
      priority: selectedTask?.priority || "medium",
      due_date: format(baseDate, "yyyy-MM-dd"),
      color,
      start_time: parsedStart?.toISOString(),
      end_time: parsedEnd?.toISOString(),
    });

    setSubmitting(false);
    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-[320px] rounded-xl border border-white/10 bg-card/70 backdrop-blur-2xl shadow-2xl p-4"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">
            {selectedTask ? "Edit task" : "Add new task"}
          </span>
          <div className="flex items-center gap-1.5">
            <button className="p-1 rounded hover:bg-accent/40 text-muted-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-accent/40 text-muted-foreground transition-colors">
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-accent/40 text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <Input
          placeholder="Task name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-muted/40 border-border/50 text-sm mb-3 h-9 placeholder:text-muted-foreground/60"
          autoFocus
        />

        {/* Time row */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 bg-muted/40 border border-border/50 rounded-md px-2.5 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 bg-muted/40 border border-border/50 rounded-md px-2.5 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-muted/40 border-border/50 text-sm mb-3 h-9 placeholder:text-muted-foreground/60"
        />

        {/* Reminders */}
        <Input
          placeholder="Reminders"
          value={reminders}
          onChange={(e) => setReminders(e.target.value)}
          className="bg-muted/40 border-border/50 text-sm mb-4 h-9 placeholder:text-muted-foreground/60"
        />

        {/* Color picker */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Task color</span>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-5 h-5 rounded-sm transition-all",
                  color === c
                    ? "ring-2 ring-foreground ring-offset-1 ring-offset-background scale-110"
                    : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTaskDialog;
