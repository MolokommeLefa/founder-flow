 import { cn } from "@/lib/utils";
 import { Plus } from "lucide-react";
 import KanbanCard, { Task } from "./KanbanCard";
 
 interface KanbanColumnProps {
   title: string;
   status: "not_started" | "in_progress" | "completed";
   tasks: Task[];
   count: number;
 }
 
const statusDotStyles = {
  not_started: "bg-muted-foreground",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
};

const statusBadgeStyles = {
  not_started: "bg-muted/50",
  in_progress: "bg-amber-500/10",
  completed: "bg-green-500/10",
};
 
const KanbanColumn = ({ title, status, tasks, count }: KanbanColumnProps) => {
  return (
    <div className="flex-1 min-w-[280px] max-w-[360px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          statusBadgeStyles[status]
        )}>
          <div className={cn("w-2 h-2 rounded-full", statusDotStyles[status])} />
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {count}
          </span>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Cards Container */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        
        {tasks.length === 0 && (
          <div className="p-8 rounded-xl border-2 border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;