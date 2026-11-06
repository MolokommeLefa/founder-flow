import { Sunset } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
  showGreeting?: boolean;
  priorityCount?: number;
}

const DashboardHeader = ({ userName = "there", showGreeting = true, priorityCount = 0 }: DashboardHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (!showGreeting) return null;

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-medium leading-tight tracking-[-0.035em] text-foreground sm:text-[29px]">
          {getGreeting()}, {userName}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Here’s what’s on the agenda today.</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/80">
            <Sunset className="h-3 w-3 text-muted-foreground" strokeWidth={1.6} />
            {priorityCount} core {priorityCount === 1 ? "priority" : "priorities"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
