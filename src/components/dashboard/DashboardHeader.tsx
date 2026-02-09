import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

interface DashboardHeaderProps {
  userName?: string;
}

const DashboardHeader = ({ userName = "there" }: DashboardHeaderProps) => {
  const [seconds, setSeconds] = useState(0);
  const focusHours = 4;
  const focusMinutes = 32;
  const increased = true; // Could be derived from comparing with previous session

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedSeconds = seconds.toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground">You have 3 priorities for today</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>
            {focusHours}h {focusMinutes}m:{formattedSeconds}s
          </span>
          {increased ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default DashboardHeader;
