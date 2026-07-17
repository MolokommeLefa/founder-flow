import CircularProgress from "./CircularProgress";

interface TaskProgressCardProps {
  completed: number;
  total: number;
}

const TaskProgressCard = ({ completed, total }: TaskProgressCardProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <CircularProgress value={percentage} size={44} strokeWidth={4} />
        <span className="text-xs font-medium text-green-500">
          {percentage > 0 ? `+${percentage}%` : "0%"} complete
        </span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground">
          {completed}
          <span className="text-muted-foreground font-normal">/{total}</span>
        </div>
        <div className="text-sm text-muted-foreground">Tasks done</div>
      </div>
    </div>
  );
};

export default TaskProgressCard;
