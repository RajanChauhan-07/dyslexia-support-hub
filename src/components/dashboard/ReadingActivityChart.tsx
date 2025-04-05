
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface ReadingActivityChartProps {
  period: "daily" | "weekly" | "monthly" | "yearly";
}

const ReadingActivityChart = ({ period }: ReadingActivityChartProps) => {
  // Generate sample data based on the period
  const data = useMemo(() => {
    switch (period) {
      case "daily":
        return Array.from({ length: 24 }, (_, i) => ({
          name: `${i}:00`,
          words: Math.floor(Math.random() * 1000),
        }));
      case "weekly":
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days.map(day => ({
          name: day,
          words: Math.floor(Math.random() * 5000),
        }));
      case "monthly":
        return Array.from({ length: 30 }, (_, i) => ({
          name: `${i + 1}`,
          words: Math.floor(Math.random() * 3000),
        }));
      case "yearly":
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.map(month => ({
          name: month,
          words: Math.floor(Math.random() * 30000),
        }));
      default:
        return [];
    }
  }, [period]);

  const chartConfig = {
    words: {
      label: "Words Read",
      theme: {
        light: "hsl(220, 70%, 50%)",
        dark: "hsl(220, 70%, 70%)",
      },
    },
  };

  return (
    <ChartContainer className="h-80" config={chartConfig}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => 
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
          }
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <ChartTooltipContent
                  active={active}
                  payload={payload}
                  label={period}
                />
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="words"
          stroke="var(--color-words)"
          fill="var(--color-words)"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default ReadingActivityChart;
