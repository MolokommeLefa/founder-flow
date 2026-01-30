import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const MetricCard = ({ icon: Icon, label, value, change, positive }: MetricCardProps) => (
  <div className="p-5 rounded-xl bg-card border border-border">
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className={cn(
        "text-xs font-medium",
        positive ? "text-green-600" : "text-red-500"
      )}>
        {change}
      </span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export default MetricCard;
