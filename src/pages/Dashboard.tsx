
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpenText,
  Clock,
  FileText,
  Trophy,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton'; // Added missing import
import ReadingActivityChart from '@/components/dashboard/ReadingActivityChart';
import ReadingStatCard from '@/components/dashboard/ReadingStatCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// Define the reading stats interface
interface ReadingStats {
  wordsRead: number;
  averageSpeed: number;
  documentsUploaded: number;
  documentsFinished: number;
  currentStreak: number;
  longestStreak: number;
  totalReadingTime: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReadingStats>({
    wordsRead: 0,
    averageSpeed: 0,
    documentsUploaded: 0,
    documentsFinished: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalReadingTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // In a real implementation, this would fetch from Supabase
        // For now, we'll simulate a network request but return zeros for new users
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user has any reading data recorded
        // This is mocked for now - in a real implementation this would check the database
        const userHasData = false; // Set to false for new users
        
        if (userHasData) {
          // In a real app, fetch actual data from Supabase
          // For demonstration, we'll use very small numbers instead of random large ones
          const userStats: ReadingStats = {
            wordsRead: 0,
            averageSpeed: 0,
            documentsUploaded: 0,
            documentsFinished: 0,
            currentStreak: 0, 
            longestStreak: 0,
            totalReadingTime: 0
          };
          
          setStats(userStats);
          setHasData(true);
        } else {
          // Set default stats for new users (all zeros)
          setHasData(false);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-16">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Please log in to view your dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your reading progress and statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <ReadingStatCard 
          title="Words Read" 
          value={stats.wordsRead.toLocaleString()} 
          description="Total words processed"
          icon={<BookOpenText className="h-5 w-5 text-primary" />}
          isLoading={isLoading}
          isEmpty={!hasData && !isLoading}
        />
        
        <ReadingStatCard 
          title="Reading Speed" 
          value={`${stats.averageSpeed} WPM`}
          description="Average words per minute" 
          icon={<Clock className="h-5 w-5 text-primary" />}
          isLoading={isLoading}
          isEmpty={!hasData && !isLoading}
        />
        
        <ReadingStatCard 
          title="Documents" 
          value={`${stats.documentsFinished}/${stats.documentsUploaded}`}
          description="Finished / Uploaded"
          icon={<FileText className="h-5 w-5 text-primary" />}
          isLoading={isLoading}
          isEmpty={!hasData && !isLoading}
        />
        
        <ReadingStatCard 
          title="Current Streak" 
          value={`${stats.currentStreak} days`}
          description={`Longest: ${stats.longestStreak} days`}
          icon={<Trophy className="h-5 w-5 text-primary" />}
          isLoading={isLoading}
          isEmpty={!hasData && !isLoading}
        />
      </div>

      <Tabs defaultValue="daily" className="w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reading Activity</h2>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="daily" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <ReadingActivityChart period="daily" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <ReadingActivityChart period="weekly" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <ReadingActivityChart period="monthly" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <ReadingActivityChart period="yearly" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Reading Patterns
            </CardTitle>
            <CardDescription>Your reading activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : !hasData ? (
              <p className="text-muted-foreground py-4">No reading patterns data available yet. Start reading to see your patterns!</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best reading day</span>
                  <span className="font-medium">Wednesday</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most productive time</span>
                  <span className="font-medium">8:00 PM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longest reading session</span>
                  <span className="font-medium">0 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total reading time</span>
                  <span className="font-medium">{Math.floor(stats.totalReadingTime/60)} hrs {stats.totalReadingTime % 60} mins</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reading Calendar
            </CardTitle>
            <CardDescription>Your active reading days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : !hasData ? (
              <p className="text-muted-foreground py-4">No calendar data available yet. Your reading activity will appear here once you start reading.</p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => {
                  // For new users, use no activity level
                  const activityLevel = 0;
                  const getBgClass = () => {
                    switch(activityLevel) {
                      case 0: return "bg-gray-100 dark:bg-gray-800";
                      case 1: return "bg-green-100 dark:bg-green-900/30";
                      case 2: return "bg-green-200 dark:bg-green-800/40";
                      case 3: return "bg-green-300 dark:bg-green-700/50";
                      default: return "bg-gray-100 dark:bg-gray-800";
                    }
                  };
                  
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-sm ${getBgClass()} flex items-center justify-center text-xs`}
                      title={`Day ${i+1}: ${activityLevel > 0 ? `${activityLevel * 1000} words` : 'No activity'}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
