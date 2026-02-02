import { cn } from "@/lib/utils";
import SparklineChart from "./SparklineChart";

interface MetricCardProps {
  icon?: React.ElementType;
  iconClassName?: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  sparklineData?: number[];
}

const MetricCard = ({ icon: Icon, iconClassName, label, value, change, positive, sparklineData }: MetricCardProps) => (
  <div className="p-5 rounded-xl bg-card border border-border">
    <div className="flex items-center justify-between mb-3">
      {Icon && <Icon className={cn("w-5 h-5", iconClassName || "text-muted-foreground")} />}
      {!Icon && <div />}
      <span className={cn(
        "text-xs font-medium",
        positive ? "text-green-600" : "text-red-500"
      )}>
        {change}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      {sparklineData && <SparklineChart data={sparklineData} positive={positive} />}
    </div>
  </div>
);

export default MetricCard;
