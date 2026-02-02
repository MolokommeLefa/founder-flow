import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionHeatmapProps {
  data?: { date: string; hours: number }[];
}

const generateMockData = () => {
  const data: { date: string; hours: number }[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const random = Math.random();
    let hours = 0;
    if (random > 0.7) hours = Math.floor(Math.random() * 3) + 1;
    if (random > 0.85) hours = Math.floor(Math.random() * 4) + 3;
    if (random > 0.95) hours = Math.floor(Math.random() * 4) + 6;
    
    data.push({
      date: new Date(d).toISOString().split('T')[0],
      hours
    });
  }
  return data;
};

const getIntensityClass = (hours: number) => {
  if (hours === 0) return "bg-muted/30";
  if (hours <= 2) return "bg-green-900/60";
  if (hours <= 4) return "bg-green-700/80";
  if (hours <= 6) return "bg-green-500";
  return "bg-green-400";
};

const ContributionHeatmap = ({ data }: ContributionHeatmapProps) => {
  const contributionData = useMemo(() => data || generateMockData(), [data]);
  
  const { weeks, months } = useMemo(() => {
    const weekMap: { date: string; hours: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; hours: number; dayOfWeek: number }[] = [];
    const monthLabels: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    contributionData.forEach((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weekMap.push(currentWeek);
        currentWeek = [];
      }
      
      if (month !== lastMonth) {
        monthLabels.push({
          name: date.toLocaleString('default', { month: 'short' }),
          weekIndex: weekMap.length
        });
        lastMonth = month;
      }
      
      currentWeek.push({ ...item, dayOfWeek });
    });
    
    if (currentWeek.length > 0) {
      weekMap.push(currentWeek);
    }
    
    return { weeks: weekMap, months: monthLabels };
  }, [contributionData]);

  const totalHours = useMemo(() => 
    contributionData.reduce((sum, item) => sum + item.hours, 0),
    [contributionData]
  );

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Focus Contributions</h2>
          <p className="text-sm text-muted-foreground">
            {totalHours} hours of deep work in the last year
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[750px]">
          {/* Month labels */}
          <div className="flex mb-2 ml-8">
            {months.map((month, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{ 
                  position: 'relative',
                  left: `${month.weekIndex * 14}px`,
                  marginRight: i < months.length - 1 ? 
                    `${(months[i + 1]?.weekIndex - month.weekIndex) * 14 - 30}px` : 0
                }}
              >
                {month.name}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 pt-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-[11px] text-xs text-muted-foreground flex items-center">
                  {label}
                </div>
              ))}
            </div>
            
            {/* Contribution squares */}
            <div className="flex gap-[3px]">
              <TooltipProvider delayDuration={100}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const dayData = week.find(d => d.dayOfWeek === dayIndex);
                      if (!dayData) {
                        return <div key={dayIndex} className="w-[11px] h-[11px]" />;
                      }
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-foreground/50 ${getIntensityClass(dayData.hours)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{dayData.hours} hours</p>
                            <p className="text-muted-foreground">{dayData.date}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-[3px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-muted/30" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-900/60" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-700/80" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-500" />
              <div className="w-[11px] h-[11px] rounded-sm bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
