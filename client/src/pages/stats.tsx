import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Clock, TrendingUp, Calendar, Trophy, Dumbbell, BarChart3 } from "lucide-react";

interface WorkoutStats {
  summary: {
    totalCompletedWorkouts: number;
    totalActiveMinutes: number;
    avgWorkoutDuration: number;
    workoutsPerWeek: number;
    daysActive: number;
    weeklyTrend: number;
  };
  trends: {
    lastWeek: number;
    lastMonth: number;
    lastThreeMonths: number;
  };
  workoutsByType: {
    type: string;
    count: number;
  }[];
  workoutsByDay: {
    day: string;
    count: number;
  }[];
  dailyActiveMinutes: {
    date: string;
    minutes: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a480cf', '#3F51B5', '#9C27B0'];

export default function Stats() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: stats, isLoading } = useQuery<WorkoutStats>({
    queryKey: ["/api/workout-stats"],
  });
  
  // Header with sticky mobile top bar
  const Header = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden dark:bg-neutral-800 dark:border-neutral-700">
      <div className="flex items-center gap-2 font-semibold">
        <div className="text-primary text-2xl"><BarChart3 /></div>
        <span className="text-lg font-bold text-primary">Workout Statistics</span>
      </div>
    </header>
  );
  
  const SummaryMetrics = () => {
    if (!stats) return null;
    
    const { summary } = stats;
    
    const metrics = [
      {
        title: "Total Workouts",
        value: summary.totalCompletedWorkouts,
        icon: <Dumbbell className="h-5 w-5 text-indigo-500" />,
        color: "text-indigo-500"
      },
      {
        title: "Active Minutes",
        value: summary.totalActiveMinutes,
        icon: <Clock className="h-5 w-5 text-green-500" />,
        color: "text-green-500"
      },
      {
        title: "Avg. Duration",
        value: `${summary.avgWorkoutDuration} min`,
        icon: <Activity className="h-5 w-5 text-orange-500" />,
        color: "text-orange-500"
      },
      {
        title: "Workouts/Week",
        value: summary.workoutsPerWeek,
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        color: "text-blue-500"
      },
      {
        title: "Days Active",
        value: summary.daysActive,
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
        color: "text-yellow-500"
      },
      {
        title: "Weekly Trend",
        value: summary.weeklyTrend >= 0 ? `+${summary.weeklyTrend}` : summary.weeklyTrend,
        icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
        color: summary.weeklyTrend >= 0 ? "text-green-500" : "text-red-500"
      }
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="mb-2">{metric.icon}</div>
              <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{metric.title}</h3>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  const TimelineCharts = () => {
    if (!stats) return null;
    
    // Format date labels for better display
    const formattedDailyMinutes = stats.dailyActiveMinutes.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
    
    // Only show every few days to avoid crowding on mobile
    const filteredDates = formattedDailyMinutes.filter((_, i) => i % 5 === 0 || i === formattedDailyMinutes.length - 1);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Minutes</CardTitle>
            <CardDescription>Your active workout time over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedDailyMinutes}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    ticks={filteredDates.map(d => d.date)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} minutes`, 'Active Time']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Workouts by Day</CardTitle>
              <CardDescription>Which days you work out the most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.workoutsByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(day) => day.substring(0, 3)} 
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} workouts`, 'Count']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="count" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Workouts by Type</CardTitle>
              <CardDescription>Distribution of your workout types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.workoutsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="type"
                      label={({type, count}) => `${type}: ${count}`}
                      labelLine={false}
                    >
                      {stats.workoutsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [`${value} workouts`, props.payload.type]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  const TrendsCard = () => {
    if (!stats) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Trends</CardTitle>
          <CardDescription>Your workout completion over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Week</p>
                <p className="text-2xl font-bold">{stats.trends.lastWeek}</p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Month</p>
                <p className="text-2xl font-bold">{stats.trends.lastMonth}</p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Last 3 Months</p>
                <p className="text-2xl font-bold">{stats.trends.lastThreeMonths}</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Last Week", value: stats.trends.lastWeek },
                    { name: "Last Month", value: stats.trends.lastMonth },
                    { name: "Last 3 Months", value: stats.trends.lastThreeMonths }
                  ]}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value} workouts`, 'Count']} />
                  <Bar dataKey="value" fill="#3b82f6">
                    <Cell fill="#3b82f6" />
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#ec4899" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <Sidebar />
      
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workout Statistics</h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Analyze your fitness progress and workout patterns
              </p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-72" />
              <Skeleton className="h-64" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="charts">Detailed Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <SummaryMetrics />
                  <TrendsCard />
                </TabsContent>
                
                <TabsContent value="charts">
                  <TimelineCharts />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="p-10 text-center">
              <div className="mb-4 text-5xl">📊</div>
              <h3 className="text-lg font-medium mb-2">No Statistics Available</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Complete workouts to see your statistics and progress
              </p>
            </Card>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}