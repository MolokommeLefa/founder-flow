import { useMemo } from "react";
import { DbTask } from "@/hooks/useTasks";

const OnTrackIcon = () => (
  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <path d="M1 6C3 3 5 1.5 7 4C9 6.5 11 9 13 6C15 3 17 1 17 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const AtRiskIcon = () => (
  <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <path d="M1 6L5 2L9 8L13 4L17 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const OffTrackIcon = () => (
  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <path d="M1 2L5 8L9 4L13 10L17 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

interface OverallPerformanceProps {
  tasks: DbTask[];
}

const OverallPerformance = ({ tasks }: OverallPerformanceProps) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return { onTrack: 0, atRisk: 0, offTrack: 0, percentage: 0 };

    const completed = tasks.filter(t => t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const notStarted = tasks.filter(t => t.status === "not_started").length;

    // On Track = completed + in_progress with non-high priority
    const onTrack = completed + inProgress;
    // At Risk = not_started with medium priority or in_progress high priority
    const atRisk = tasks.filter(t => 
      (t.status === "not_started" && t.priority === "medium") ||
      (t.status === "in_progress" && t.priority === "high")
    ).length;
    // Off Track = not_started with high priority
    const offTrack = tasks.filter(t => 
      t.status === "not_started" && t.priority === "high"
    ).length;

    const percentage = total > 0 ? Math.round((onTrack / total) * 100 * 10) / 10 : 0;

    return { onTrack, atRisk, offTrack, percentage };
  }, [tasks]);

  // SVG donut chart
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = stats.onTrack + stats.atRisk + stats.offTrack || 1;
  const onTrackAngle = (stats.onTrack / total) * circumference;
  const atRiskAngle = (stats.atRisk / total) * circumference;
  const offTrackAngle = (stats.offTrack / total) * circumference;

  // Offsets for each segment
  const onTrackOffset = 0;
  const atRiskOffset = onTrackAngle;
  const offTrackOffset = onTrackAngle + atRiskAngle;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Overall Performance</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Legend */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <OnTrackIcon />
            <span className="text-sm text-muted-foreground">On Track</span>
          </div>
          <div className="flex items-center gap-3">
            <AtRiskIcon />
            <span className="text-sm text-muted-foreground">At Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <OffTrackIcon />
            <span className="text-sm text-muted-foreground">Off Track</span>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="relative flex-1 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            {/* On Track (green) */}
            {stats.onTrack > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#22c55e"
                strokeWidth={strokeWidth}
                strokeDasharray={`${onTrackAngle} ${circumference - onTrackAngle}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
            {/* At Risk (yellow) */}
            {stats.atRisk > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#eab308"
                strokeWidth={strokeWidth}
                strokeDasharray={`${atRiskAngle} ${circumference - atRiskAngle}`}
                strokeDashoffset={-onTrackAngle}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
            {/* Off Track (red) */}
            {stats.offTrack > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth={strokeWidth}
                strokeDasharray={`${offTrackAngle} ${circumference - offTrackAngle}`}
                strokeDashoffset={-(onTrackAngle + atRiskAngle)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{stats.percentage}%</span>
            <span className="text-xs text-muted-foreground">healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallPerformance;
