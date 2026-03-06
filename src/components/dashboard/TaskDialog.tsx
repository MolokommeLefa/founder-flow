import { useState, useEffect } from "react";
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
      resetForm();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] backdrop-blur-2xl bg-card/60 border border-white/10 shadow-elevated">
        <DialogHeader>
          <DialogTitle>{selectedTask ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {selectedTask ?
            "Update task details and manage its status." :
            "Create a new task and assign it to a date."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 opacity-95">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required />

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3} />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as NewTask["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as NewTask["priority"])}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} />

          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)} />

            </div>
          </div>

          <div className="space-y-2">
            <Label>Task Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? selectedTask ? "Updating..." : "Creating..." : selectedTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

};

export default TaskDialog;