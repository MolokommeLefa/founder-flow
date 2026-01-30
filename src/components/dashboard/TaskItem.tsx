import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  title: string;
  status: "done" | "pending" | "urgent";
  priority: string;
}

const TaskItem = ({ title, status, priority }: TaskItemProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
    {status === "done" ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : status === "urgent" ? (
      <AlertCircle className="w-5 h-5 text-primary" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
    )}
    <span className={cn(
      "flex-1 text-sm",
      status === "done" ? "text-muted-foreground line-through" : "text-foreground"
    )}>
      {title}
    </span>
    <span className="text-xs text-muted-foreground">{priority}</span>
  </div>
);

export default TaskItem;
