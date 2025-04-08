
import { useEffect, useState } from "react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface ReadingActivity {
  date: string;
  wordsRead: number;
}

interface ReadingActivityChartProps {
  period: "daily" | "weekly" | "monthly" | "yearly";
  data?: ReadingActivity[];
}

const ReadingActivityChart = ({ period, data = [] }: ReadingActivityChartProps) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reading activity data from Supabase
  useEffect(() => {
    if (!user) {
      setChartData(getFormattedData([]));
      setIsLoading(false);
      return;
    }

    const fetchReadingActivity = async () => {
      setIsLoading(true);
      try {
        // Get date range based on period
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case "daily":
            startDate.setDate(now.getDate() - 1); // Last 24 hours
            break;
          case "weekly":
            startDate.setDate(now.getDate() - 7);
            break;
          case "monthly":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "yearly":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        console.log(`Fetching reading activity for period ${period} from ${startDate.toISOString()}`);

        const { data: activityData, error } = await supabase
          .from('reading_activity')
          .select('*')
          .eq('user_id', user.id)
          .gte('read_at', startDate.toISOString())
          .order('read_at', { ascending: true });

        if (error) {
          console.error('Error fetching reading activity:', error);
          setChartData(getFormattedData([]));
        } else {
          console.log(`Found ${activityData.length} reading activity records`);
          const formattedActivity = activityData.map(item => ({
            date: item.read_at,
            wordsRead: item.words_read
          }));
          
          setChartData(getFormattedData(formattedActivity));
        }
      } catch (error) {
        console.error('Error in activity fetch:', error);
        setChartData(getFormattedData([]));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadingActivity();

    // Set up realtime subscription for activity updates
    const channel = supabase
      .channel('reading_activity_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reading_activity',
          filter: `user_id=eq.${user.id}`
        }, 
        (_payload) => {
          console.log('Reading activity updated, refreshing data');
          // Refresh data when activity changes
          fetchReadingActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period]);

  // Format chart data based on the time period
  const getFormattedData = (activityData: ReadingActivity[]) => {
    if (!activityData || activityData.length === 0) {
      // Return sample empty data with appropriate time labels
      switch (period) {
        case "daily":
          return Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            words: 0,
          }));
        case "weekly":
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return days.map(day => ({
            name: day,
            words: 0,
          }));
        case "monthly":
          return Array.from({ length: 30 }, (_, i) => ({
            name: `${i + 1}`,
            words: 0,
          }));
        case "yearly":
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.map(month => ({
            name: month,
            words: 0,
          }));
      }
    }

    // Process actual data
    const result = [];
    const dateMap = new Map();

    // Group data by date parts according to period
    for (const item of activityData) {
      const date = new Date(item.date);
      let key;

      switch (period) {
        case "daily":
          key = date.getHours();
          break;
        case "weekly":
          key = date.getDay(); // 0-6 (Sunday-Saturday)
          break;
        case "monthly":
          key = date.getDate(); // 1-31
          break;
        case "yearly":
          key = date.getMonth(); // 0-11
          break;
        default:
          key = date.getDate();
      }

      if (dateMap.has(key)) {
        dateMap.set(key, dateMap.get(key) + item.wordsRead);
      } else {
        dateMap.set(key, item.wordsRead);
      }
    }

    // Convert to chart format
    switch (period) {
      case "daily":
        for (let hour = 0; hour < 24; hour++) {
          result.push({
            name: `${hour}:00`,
            words: dateMap.get(hour) || 0,
          });
        }
        break;
      case "weekly":
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let day = 0; day < 7; day++) {
          result.push({
            name: days[day],
            words: dateMap.get(day) || 0,
          });
        }
        break;
      case "monthly":
        for (let day = 1; day <= 31; day++) {
          result.push({
            name: `${day}`,
            words: dateMap.get(day) || 0,
          });
        }
        break;
      case "yearly":
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let month = 0; month < 12; month++) {
          result.push({
            name: months[month],
            words: dateMap.get(month) || 0,
          });
        }
        break;
    }

    return result;
  };

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
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                    label=""
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
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default ReadingActivityChart;
