import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DbTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const OnTrackIcon = () => (
  <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center transition-transform duration-200 hover:scale-125 cursor-pointer">
    <svg width="9" height="6" viewBox="0 0 18 12" fill="none">
      <path d="M1 6C3 3 5 1.5 7 4C9 6.5 11 9 13 6C15 3 17 1 17 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const AtRiskIcon = () => (
  <div className="w-3 h-3 rounded-full bg-yellow-600 flex items-center justify-center transition-transform duration-200 hover:scale-125 cursor-pointer">
    <svg width="9" height="6" viewBox="0 0 18 12" fill="none">
      <path d="M1 6L5 2L9 8L13 4L17 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const OffTrackIcon = () => (
  <div className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center transition-transform duration-200 hover:scale-125 cursor-pointer">
    <svg width="9" height="6" viewBox="0 0 18 12" fill="none">
      <path d="M1 2L5 8L9 4L13 10L17 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

interface OverallPerformanceProps {
  tasks: DbTask[];
}

const OverallPerformance = ({ tasks }: OverallPerformanceProps) => {
  const navigate = useNavigate();
  const { projectsByStatus, loading: projectsLoading } = useProjects();

  const stats = useMemo(() => {
    // Combine task-based + project-based health
    const taskTotal = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;

    const taskOnTrack = completed + inProgress;
    const taskAtRisk = tasks.filter(t =>
      (t.status === "not_started" && t.priority === "medium") ||
      (t.status === "in_progress" && t.priority === "high")
    ).length;
    const taskOffTrack = tasks.filter(t =>
      t.status === "not_started" && t.priority === "high"
    ).length;

    const projOnTrack = projectsByStatus.on_track.length;
    const projAtRisk = projectsByStatus.at_risk.length;
    const projOffTrack = projectsByStatus.off_track.length;

    const onTrack = taskOnTrack + projOnTrack;
    const atRisk = taskAtRisk + projAtRisk;
    const offTrack = taskOffTrack + projOffTrack;

    const total = onTrack + atRisk + offTrack || 1;
    const percentage = Math.round((onTrack / total) * 100 * 10) / 10;

    return { onTrack, atRisk, offTrack, percentage, projOnTrack, projAtRisk, projOffTrack };
  }, [tasks, projectsByStatus]);

  // SVG donut chart
  const size = 180;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = stats.onTrack + stats.atRisk + stats.offTrack || 1;
  const onTrackAngle = (stats.onTrack / total) * circumference;
  const atRiskAngle = (stats.atRisk / total) * circumference;
  const offTrackAngle = (stats.offTrack / total) * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Overall Performance</h2>
        <button
          onClick={() => navigate("/projects")}
          className="text-xs text-primary font-medium hover:underline"
        >
          Projects →
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Legend */}
        <div className="space-y-3">
          <button onClick={() => navigate("/projects")} className="flex items-center gap-2.5 group cursor-pointer text-left">
            <OnTrackIcon />
            <div>
              <span className="text-sm text-muted-foreground group-hover:text-green-500 transition-colors">{stats.onTrack} On Track</span>
              {stats.projOnTrack > 0 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">({stats.projOnTrack} projects)</span>
              )}
            </div>
          </button>
          <button onClick={() => navigate("/projects")} className="flex items-center gap-2.5 group cursor-pointer text-left">
            <AtRiskIcon />
            <div>
              <span className="text-sm text-muted-foreground group-hover:text-yellow-500 transition-colors">{stats.atRisk} At Risk</span>
              {stats.projAtRisk > 0 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">({stats.projAtRisk} projects)</span>
              )}
            </div>
          </button>
          <button onClick={() => navigate("/projects")} className="flex items-center gap-2.5 group cursor-pointer text-left">
            <OffTrackIcon />
            <div>
              <span className="text-sm text-muted-foreground group-hover:text-red-500 transition-colors">{stats.offTrack} Off Track</span>
              {stats.projOffTrack > 0 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">({stats.projOffTrack} projects)</span>
              )}
            </div>
          </button>
        </div>

        {/* Donut Chart */}
        <div className="relative flex-1 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            {stats.onTrack > 0 && (
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#22c55e" strokeWidth={strokeWidth}
                strokeDasharray={`${onTrackAngle} ${circumference - onTrackAngle}`} strokeDashoffset={0}
                strokeLinecap="round" className="transition-all duration-700" />
            )}
            {stats.atRisk > 0 && (
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eab308" strokeWidth={strokeWidth}
                strokeDasharray={`${atRiskAngle} ${circumference - atRiskAngle}`} strokeDashoffset={-onTrackAngle}
                strokeLinecap="round" className="transition-all duration-700" />
            )}
            {stats.offTrack > 0 && (
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
                strokeDasharray={`${offTrackAngle} ${circumference - offTrackAngle}`} strokeDashoffset={-(onTrackAngle + atRiskAngle)}
                strokeLinecap="round" className="transition-all duration-700" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-poppins font-[500] text-foreground">{stats.percentage}%</span>
            <span className="text-xs font-poppins font-[500] text-muted-foreground">healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallPerformance;
