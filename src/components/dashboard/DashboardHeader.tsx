import { useEffect, useState } from "react";
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
        setSearchOpen((o) => !o);
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
    <div className={`flex items-center ${showGreeting ? "justify-between mb-8" : "justify-end mb-4"}`}>
      {showGreeting && (
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-muted-foreground">
            {priorityCount > 0
              ? `You have ${priorityCount} ${priorityCount === 1 ? "priority" : "priorities"} for today`
              : "No priorities for today"}
          </p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <WorkspaceSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <HeaderQuickActions />
      </div>
    </div>
  );
};

export default DashboardHeader;
