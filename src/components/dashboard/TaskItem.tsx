import { CheckCircle2, AlertCircle, Check, CalendarClock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  <div className={cn(
    "group flex min-h-[46px] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-secondary/35",
    status === "done" && "opacity-75"
  )}>
    {status === "done" ? (
      <CheckCircle2 className="h-[18px] w-[18px] shrink-0 fill-lime-500 text-lime-500 [&>path]:stroke-background" strokeWidth={1.8} />
    ) : status === "urgent" ? (
      <AlertCircle className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
    ) : (
      <Circle className="h-[18px] w-[18px] shrink-0 text-foreground/80" strokeWidth={1.6} />
    )}
    <span className={cn(
      "min-w-0 flex-1 truncate text-[13px] font-medium transition-colors",
      status === "done" ? "text-muted-foreground line-through decoration-muted-foreground/70" : "text-foreground"
    )}>
      {title}
    </span>

    <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
      <Badge variant="outline" className={cn(
        "hidden min-w-[88px] justify-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline-flex",
        status === "done" && "border-lime-500/30 bg-lime-500/10 text-lime-400",
        status === "pending" && "border-yellow-500/35 bg-yellow-500/10 text-yellow-400",
        status === "urgent" && "border-border bg-secondary/50 text-muted-foreground"
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", status === "done" ? "bg-lime-400" : status === "pending" ? "bg-yellow-400" : "bg-muted-foreground")} />
        {status === "done" ? "Completed" : status === "pending" ? "In progress" : "Draft"}
      </Badge>
      <Badge variant="outline" className={cn(
        "min-w-[66px] justify-center rounded-full px-2.5 py-1 text-[10px] font-medium",
        priority.toLowerCase() === "high" && "border-red-500/35 bg-red-500/10 text-red-400",
        priority.toLowerCase() === "medium" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        priority.toLowerCase() !== "high" && priority.toLowerCase() !== "medium" && "border-border text-muted-foreground"
      )}>{priority}</Badge>
    </div>

    {(onComplete || onPostpone) && status !== "done" && (
      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        {onComplete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground" disabled={busy} onClick={(e) => { e.stopPropagation(); onComplete(); }} aria-label="Mark as done">
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as done</TooltipContent>
          </Tooltip>
        )}
        {onPostpone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground" disabled={busy} onClick={(e) => { e.stopPropagation(); onPostpone(); }} aria-label="Postpone to tomorrow">
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Postpone to tomorrow</TooltipContent>
          </Tooltip>
        )}
      </div>
    )}
  </div>
);

export default TaskItem;
