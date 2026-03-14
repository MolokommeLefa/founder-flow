import { format } from "date-fns";
import { X, Clock, Calendar, Flag, Palette, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import type { DbTask, NewTask } from "@/hooks/useTasks";

const PRESET_COLORS = [
  "#2563eb", "#dc2626", "#ca8a04", "#ec4899", "#16a34a",
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-600" },
};

const PRIORITY_MAP: Record<string, { label: string; icon: string }> = {
  low: { label: "Low", icon: "↓" },
  medium: { label: "Medium", icon: "→" },
  high: { label: "High", icon: "↑" },
};

interface TaskSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DbTask | null;
  onUpdate: (taskId: string, updates: Partial<NewTask>) => Promise<boolean>;
  onDelete?: (taskId: string) => Promise<boolean>;
}

const TaskSidePanel = ({ open, onOpenChange, task, onUpdate, onDelete }: TaskSidePanelProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("not_started");
  const [priority, setPriority] = useState<string>("medium");
  const [color, setColor] = useState("#2563eb");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setColor(task.color || "#2563eb");
      setStartTime(task.start_time ? format(new Date(task.start_time), "h:mm a") : "");
      setEndTime(task.end_time ? format(new Date(task.end_time), "h:mm a") : "");
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const parseTime = (timeStr: string, baseDate: Date): string | undefined => {
      const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
      if (!match) return undefined;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2] || "0");
      const period = match[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const d = new Date(baseDate);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    };

    const baseDate = task.due_date ? new Date(task.due_date) : new Date();

    const success = await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      status: status as NewTask["status"],
      priority: priority as NewTask["priority"],
      color,
      start_time: startTime ? parseTime(startTime, baseDate) : undefined,
      end_time: endTime ? parseTime(endTime, baseDate) : undefined,
    });

    setSaving(false);
    if (success) {
      toast({ title: "Task updated", description: `"${title.trim()}" saved.` });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const success = await onDelete(task.id);
    if (success) onOpenChange(false);
  };

  const statusInfo = STATUS_MAP[status] || STATUS_MAP.not_started;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 border-l border-border/50 bg-background">
        {/* Color accent bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-6px)]">
          {/* Header */}
          <SheetHeader className="space-y-3 p-0">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                {PRIORITY_MAP[priority]?.icon} {PRIORITY_MAP[priority]?.label}
              </Badge>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0 shadow-none"
              placeholder="Task title"
            />
          </SheetHeader>

          <Separator />

          {/* Properties */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24 shrink-0">Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 bg-muted/30 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24 shrink-0 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priority
              </span>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 bg-muted/30 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24 shrink-0 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </span>
              <span className="text-sm text-foreground">
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No date"}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24 shrink-0 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Time
              </span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Start"
                  className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground text-sm shrink-0">→</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="End"
                  className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24 shrink-0 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Color
              </span>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color === c
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Description
            </span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[120px] bg-muted/30 border-border/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={!title.trim() || saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {onDelete && (
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Meta */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2">
            <p>Created: {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
            <p>Updated: {format(new Date(task.updated_at), "MMM d, yyyy 'at' h:mm a")}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSidePanel;
