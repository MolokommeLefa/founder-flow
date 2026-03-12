import { TrendingUp, TrendingDown, Play, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  userName?: string;
  showGreeting?: boolean;
  priorityCount?: number;
}

const DashboardHeader = ({ userName = "there" }: DashboardHeaderProps) => {
  const [expanded, setExpanded] = useState(false);
  const { elapsedSeconds, isRunning, toggle, reset, formattedTime } = useFocusTimer();
  const increased = true;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const seconds = elapsedSeconds % 60;
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
              ? "px-5 py-3 min-w-[280px]"
              : "px-3.5 py-2 min-w-[130px]"
            }
          `}
        >
          {/* Animated clock ring */}
          <div className="relative flex-shrink-0">
            <svg width={expanded ? "28" : "22"} height={expanded ? "28" : "22"} viewBox="0 0 22 22" className="transition-all duration-500">
              <circle cx="11" cy="11" r="8" fill="none" stroke="hsl(145 60% 42% / 0.2)" strokeWidth="2.5" />
              <circle
                cx="11" cy="11" r="8" fill="none"
                stroke={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"}
                strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 11 11)"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
              <line x1="11" y1="11" x2="11" y2="7.5" stroke={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"} strokeWidth="1.5" strokeLinecap="round" />
              <line
                x1="11" y1="11" x2="14" y2="12"
                stroke={isRunning ? "hsl(145 60% 42% / 0.7)" : "hsl(0 0% 45% / 0.5)"}
                strokeWidth="1" strokeLinecap="round"
                transform={`rotate(${seconds * 6} 11 11)`}
                className="transition-transform duration-1000 ease-linear origin-center"
              />
              <circle cx="11" cy="11" r="1" fill={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"} />
            </svg>
          </div>

          {/* Time display */}
          <span className={`
            font-mono font-semibold tracking-tight transition-all duration-500
            ${isRunning ? "text-[hsl(145,60%,42%)]" : "text-[hsl(0,0%,50%)]"}
            ${expanded ? "text-lg" : "text-sm"}
          `}>
            {formattedTime}
          </span>

          {/* Expanded content */}
          <div className={`
            overflow-hidden transition-all duration-500
            ${expanded ? "max-w-[160px] opacity-100 ml-1" : "max-w-0 opacity-0"}
          `}>
            <div className="flex items-center gap-2 whitespace-nowrap">
              {/* Play/Pause */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(); }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {isRunning ? (
                      <Pause className="w-4 h-4 text-[hsl(145,60%,42%)]" />
                    ) : (
                      <Play className="w-4 h-4 text-[hsl(0,0%,55%)]" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isRunning ? "Pause" : "Start"}</TooltipContent>
              </Tooltip>

              {/* Reset */}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[hsl(0,0%,45%)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Reset</TooltipContent>
              </Tooltip>

              {/* Trend */}
              <div className="flex items-center gap-1">
                {increased ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[hsl(145,60%,42%)]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[hsl(145,60%,42%)]" />
                )}
                <span className="text-[11px] text-[hsl(0,0%,55%)] font-medium">
                  {increased ? "+12%" : "-5%"}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-[hsl(0,0%,40%)] block mt-0.5">
              {isRunning ? "Focus active" : "Timer paused"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
