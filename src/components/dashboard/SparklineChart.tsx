import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  positive?: boolean;
}

const SparklineChart = ({ data, positive = true }: SparklineChartProps) => {
  const chartData = data.map((value, index) => ({ value, index }));
  const strokeColor = positive ? "hsl(var(--success, 142 76% 36%))" : "hsl(var(--destructive))";

  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
