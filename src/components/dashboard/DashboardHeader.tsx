import { Clock } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
}

const DashboardHeader = ({ userName = "there" }: DashboardHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground">You have 3 priorities for today</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Focus time: 4h 32m</span>
      </div>
    </div>
  );
};

export default DashboardHeader;
