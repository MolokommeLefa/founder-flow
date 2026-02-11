import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

interface DashboardHeaderProps {
  userName?: string;
}

const DashboardHeader = ({ userName = "there" }: DashboardHeaderProps) => {
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const focusHours = 4;
  const focusMinutes = 32;
  const increased = true;

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

  // SVG animated clock icon matching Dynamic Island amber style
  const progressPercent = (seconds / 60) * 100;
  const circumference = 2 * Math.PI * 8;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground">You have 3 priorities for today</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Dynamic Island Focus Timer */}
        <div
          onClick={() => setExpanded(!expanded)}
          className={`
            relative cursor-pointer select-none
            bg-[#1a1a1a] dark:bg-[#0a0a0a]
            rounded-[22px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]
            flex items-center gap-3
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${expanded
              ? "px-5 py-3 min-w-[220px]"
              : "px-3.5 py-2 min-w-[130px]"
            }
          `}
        >
          {/* Animated clock ring */}
          <div className="relative flex-shrink-0">
            <svg width={expanded ? "28" : "22"} height={expanded ? "28" : "22"} viewBox="0 0 22 22" className="transition-all duration-500">
              {/* Background ring */}
              <circle
                cx="11" cy="11" r="8"
                fill="none"
                stroke="hsl(35 90% 50% / 0.2)"
                strokeWidth="2.5"
              />
              {/* Progress ring */}
              <circle
                cx="11" cy="11" r="8"
                fill="none"
                stroke="hsl(35 90% 55%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 11 11)"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
              {/* Clock hands */}
              <line x1="11" y1="11" x2="11" y2="7.5" stroke="hsl(35 90% 55%)" strokeWidth="1.5" strokeLinecap="round" />
              <line
                x1="11" y1="11" x2="14" y2="12"
                stroke="hsl(35 90% 55% / 0.7)"
                strokeWidth="1"
                strokeLinecap="round"
                transform={`rotate(${seconds * 6} 11 11)`}
                className="transition-transform duration-1000 ease-linear origin-center"
              />
              <circle cx="11" cy="11" r="1" fill="hsl(35 90% 55%)" />
            </svg>
          </div>

          {/* Time display */}
          <span
            className={`
              font-mono font-semibold tracking-tight
              text-[hsl(35,90%,55%)]
              transition-all duration-500
              ${expanded ? "text-lg" : "text-sm"}
            `}
          >
            {focusHours}:{focusMinutes.toString().padStart(2, "0")}:{formattedSeconds}
          </span>

          {/* Expanded content */}
          <div className={`
            overflow-hidden transition-all duration-500
            ${expanded ? "max-w-[100px] opacity-100 ml-1" : "max-w-0 opacity-0"}
          `}>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {increased ? (
                <TrendingUp className="w-3.5 h-3.5 text-[hsl(35,90%,55%)]" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-[hsl(35,90%,55%)]" />
              )}
              <span className="text-[11px] text-[hsl(0,0%,55%)] font-medium">
                {increased ? "+12%" : "-5%"}
              </span>
            </div>
            <span className="text-[10px] text-[hsl(0,0%,40%)] block">
              Focus time
            </span>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </div>
  );
};

export default DashboardHeader;
