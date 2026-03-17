import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import type { NewTask, DbTask } from "@/hooks/useTasks";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

type NotificationType = "success" | "error" | "warning";

interface TaskNotification {
  id: string;
  type: NotificationType;
  message: string;
}

const NOTIFICATION_DISMISS_MS = 3500;
const DIALOG_CLOSE_DELAY_MS = 1500;

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ElementType;
  dotColor: string;
  containerClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    dotColor: "bg-green-500",
    containerClass:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-200",
  },
  error: {
    icon: XCircle,
    dotColor: "bg-red-500",
    containerClass:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200",
  },
  warning: {
    icon: AlertCircle,
    dotColor: "bg-yellow-500",
    containerClass:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200",
  },
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: NewTask) => Promise<boolean>;
  selectedDate?: Date | null;
  selectedTask?: DbTask | null;
}

const TaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedDate,
  selectedTask
}: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<NewTask["status"]>("not_started");
  const [priority, setPriority] = useState<NewTask["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, NOTIFICATION_DISMISS_MS);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (selectedTask) {
      // Edit mode: populate form with task data
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setDueDate(selectedTask.due_date || "");
      setColor(selectedTask.color || "#2563eb");
      setStartTime(selectedTask.start_time ? selectedTask.start_time.substring(0, 16) : "");
      setEndTime(selectedTask.end_time ? selectedTask.end_time.substring(0, 16) : "");
    } else if (selectedDate) {
      // Create mode: pre-fill with selected date
      setTitle("");
      setDescription("");
      setStatus("not_started");
      setPriority("medium");
      setDueDate(format(selectedDate, "yyyy-MM-dd"));
      setColor("#2563eb");
      setStartTime("");
      setEndTime("");
    } else {
      // Default create mode
      resetForm();
    }
  }, [selectedTask, selectedDate, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("not_started");
    setPriority("medium");
    setDueDate("");
    setColor("#2563eb");
    setStartTime("");
    setEndTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      due_date: dueDate || undefined,
      color: color,
      start_time: startTime || undefined,
      end_time: endTime || undefined
    });

    setSubmitting(false);
    if (success) {
      addNotification(
        selectedTask ? "warning" : "success",
        selectedTask ? "Task updated successfully" : "Task created successfully"
      );
      setTimeout(() => {
        resetForm();
        setNotifications([]);
        onOpenChange(false);
      }, DIALOG_CLOSE_DELAY_MS);
    }
  };

  const handleClose = () => {
    resetForm();
    setNotifications([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-2xl bg-white/85 dark:bg-card/80 border border-white/50 dark:border-white/10 shadow-elevated relative">
        {/* Status notification indicators */}
        {notifications.length > 0 && (
          <div
            className="absolute top-12 right-4 z-10 flex flex-col gap-2"
            aria-live="polite"
            aria-label="Task status notifications"
          >
            {notifications.map((notification) => {
              const config = NOTIFICATION_CONFIG[notification.type];
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  role="alert"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium shadow-md animate-notification ${config.containerClass}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${config.dotColor}`} aria-hidden="true" />
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>{notification.message}</span>
                  <button
                    type="button"
                    onClick={() => removeNotification(notification.id)}
                    className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {selectedTask ? "Edit Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {selectedTask
              ? "Update task details and manage its status."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              aria-required="true"
              className="rounded-lg border-border/60 bg-background/60 focus:bg-background transition-colors" />

          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="rounded-lg border-border/60 bg-background/60 focus:bg-background transition-colors resize-none" />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as NewTask["status"])}>
                <SelectTrigger className="rounded-lg border-border/60 bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as NewTask["priority"])}>
                <SelectTrigger className="rounded-lg border-border/60 bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border-border/60 bg-background/60 focus:bg-background transition-colors" />

          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignee" className="text-sm font-medium">Assignee</Label>
            <Input
              id="assignee"
              placeholder="To be linked to team members..."
              disabled
              aria-disabled="true"
              aria-label="Assignee — coming soon"
              className="rounded-lg border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed" />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-sm font-medium">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border-border/60 bg-background/60 focus:bg-background transition-colors" />

            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-sm font-medium">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border-border/60 bg-background/60 focus:bg-background transition-colors" />

            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Task Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-lg border-border/70 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100">
              {submitting
                ? selectedTask ? "Updating..." : "Creating..."
                : selectedTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

};

export default TaskDialog;