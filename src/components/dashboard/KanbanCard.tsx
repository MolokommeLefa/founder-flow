 import { cn } from "@/lib/utils";
 import { MoreHorizontal, Calendar } from "lucide-react";
 
 export interface Task {
   id: string;
   title: string;
   description?: string;
   priority: "low" | "medium" | "high";
   dueDate?: string;
 }
 
 interface KanbanCardProps {
   task: Task;
 }
 
 const priorityStyles = {
   low: "bg-muted text-muted-foreground",
   medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
   high: "bg-destructive/10 text-destructive",
 };
 
 const KanbanCard = ({ task }: KanbanCardProps) => {
   return (
     <div className="group p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer">
       <div className="flex items-start justify-between gap-2 mb-2">
         <h4 className="text-sm font-medium text-foreground leading-snug">
           {task.title}
         </h4>
         <button className="opacity-0 group-hover:opacity-100 p-1 -m-1 rounded-lg hover:bg-secondary transition-all">
           <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
         </button>
       </div>
       
       {task.description && (
         <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
           {task.description}
         </p>
       )}
       
       <div className="flex items-center justify-between">
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
   );
 };
 
 export default KanbanCard;