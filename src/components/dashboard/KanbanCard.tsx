import { cn } from "@/lib/utils";
import { MoreHorizontal, Calendar, GripVertical } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

interface KanbanCardProps {
  task: Task;
  index: number;
}

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-destructive/10 text-destructive",
};

const KanbanCard = ({ task, index }: KanbanCardProps) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer",
            snapshot.isDragging && "shadow-lg border-primary/30 rotate-[2deg] scale-105"
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-2">
              <div
                {...provided.dragHandleProps}
                className="opacity-0 group-hover:opacity-100 pt-0.5 cursor-grab active:cursor-grabbing transition-opacity"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-medium text-foreground leading-snug">
                {task.title}
              </h4>
            </div>
            <button className="opacity-0 group-hover:opacity-100 p-1 -m-1 rounded-lg hover:bg-secondary transition-all">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 pl-6">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pl-6">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
              priorityStyles[task.priority]
            )}>
              {task.priority}
            </span>

            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
