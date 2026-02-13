import { Play, Pause, RotateCcw } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FloatingFocusTimer = () => {
  const { elapsedSeconds, isRunning, toggle, reset, formattedTime } = useFocusTimer();

  const seconds = elapsedSeconds % 60;
  const progressPercent = (seconds / 60) * 100;
  const circumference = 2 * Math.PI * 8;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <div
        className="
          bg-[#1a1a1a] dark:bg-[#0a0a0a]
          rounded-[22px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]
          flex items-center gap-3 px-4 py-2.5
          border border-white/5
        "
      >
        {/* Animated clock ring */}
        <div className="relative flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="8" fill="none" stroke="hsl(145 60% 42% / 0.2)" strokeWidth="2.5" />
            <circle
              cx="11" cy="11" r="8" fill="none"
              stroke={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"}
              strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 11 11)"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
            <circle cx="11" cy="11" r="1" fill={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"} />
            <line x1="11" y1="11" x2="11" y2="7.5" stroke={isRunning ? "hsl(145 60% 42%)" : "hsl(0 0% 45%)"} strokeWidth="1.5" strokeLinecap="round" />
            <line
              x1="11" y1="11" x2="14" y2="12"
              stroke={isRunning ? "hsl(145 60% 42% / 0.7)" : "hsl(0 0% 45% / 0.5)"}
              strokeWidth="1" strokeLinecap="round"
              transform={`rotate(${seconds * 6} 11 11)`}
              className="transition-transform duration-1000 ease-linear"
            />
          </svg>
        </div>

        {/* Time */}
        <span className={`font-mono font-semibold text-sm tracking-tight ${isRunning ? "text-[hsl(145,60%,42%)]" : "text-[hsl(0,0%,50%)]"}`}>
          {formattedTime}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 ml-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                {isRunning ? (
                  <Pause className="w-3.5 h-3.5 text-[hsl(145,60%,42%)]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[hsl(0,0%,55%)]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{isRunning ? "Pause" : "Start"}</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={reset}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[hsl(0,0%,45%)]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Reset</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default FloatingFocusTimer;
