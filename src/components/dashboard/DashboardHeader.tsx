import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import WorkspaceSearch from "@/components/search/WorkspaceSearch";
import HeaderQuickActions from "./HeaderQuickActions";

interface DashboardHeaderProps {
  userName?: string;
  showGreeting?: boolean;
  priorityCount?: number;
}

const DashboardHeader = ({ userName = "there", showGreeting = true, priorityCount = 0 }: DashboardHeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handleOpen = () => setSearchOpen(true);
    window.addEventListener("open-workspace-search", handleOpen);
    return () => window.removeEventListener("open-workspace-search", handleOpen);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className={`flex items-start gap-4 ${showGreeting ? "justify-between mb-5" : "justify-end mb-4"}`}>
      {showGreeting && (
        <div className="min-w-0">
          <h1 className="text-[26px] font-medium leading-tight tracking-[-0.035em] text-foreground sm:text-[29px]">
            {getGreeting()}, {userName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Here’s what’s on the agenda today.</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/80">
              <Sparkles className="h-3 w-3 text-muted-foreground" strokeWidth={1.6} />
              {priorityCount} core {priorityCount === 1 ? "priority" : "priorities"}
            </span>
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <WorkspaceSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <HeaderQuickActions />
      </div>
    </div>
  );
};

export default DashboardHeader;
