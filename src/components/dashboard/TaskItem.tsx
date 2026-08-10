import { CheckCircle2, AlertCircle, Check, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskItemProps {
  title: string;
  status: "done" | "pending" | "urgent";
  priority: string;
  onComplete?: () => void;
  onPostpone?: () => void;
  busy?: boolean;
}

const TaskItem = ({ title, status, priority, onComplete, onPostpone, busy }: TaskItemProps) => (
  <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
    {status === "done" ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : status === "urgent" ? (
      <AlertCircle className="w-5 h-5 text-primary" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
    )}
    <span className={cn(
      "flex-1 text-sm truncate",
      status === "done" ? "text-muted-foreground line-through" : "text-foreground"
    )}>
      {title}
    </span>

    {(onComplete || onPostpone) && status !== "done" && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {onComplete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={busy}
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                aria-label="Mark as done"
              >
                <Check className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as done</TooltipContent>
          </Tooltip>
        )}
        {onPostpone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={busy}
                onClick={(e) => { e.stopPropagation(); onPostpone(); }}
                aria-label="Postpone to tomorrow"
              >
                <CalendarClock className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Postpone to tomorrow</TooltipContent>
          </Tooltip>
        )}
      </div>
    )}

    <span className="text-xs text-muted-foreground shrink-0">{priority}</span>
  </div>
);

export default TaskItem;
