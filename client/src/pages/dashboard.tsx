import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WorkoutPlan } from "@/components/dashboard/workout-plan";
import { ProgressWidget } from "@/components/dashboard/progress-widget";
import { FriendActivity } from "@/components/dashboard/friend-activity";
import { MotivationalQuote } from "@/components/dashboard/motivational-quote";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Workout } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  const { data: workouts = [], isLoading: isWorkoutsLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });
  
  // Get the most recent active workout
  const activeWorkout = workouts.find(w => !w.completed);
  
  // Header with sticky mobile top bar
  const Header = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden dark:bg-neutral-800 dark:border-neutral-700">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="text-primary text-2xl">⚡</div>
        <span className="text-lg font-bold text-primary">Fitness Buddy</span>
      </Link>
    </header>
  );
  
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <Sidebar />
      
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Fitness Buddy'}!
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Let's continue your fitness journey today
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/workouts/new">
                  <Button>
                    <Plus className="mr-1 h-4 w-4" /> New Workout
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isStatsLoading ? (
                <>
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </>
              ) : (
                <>
                  <StatsCard
                    title="Weekly Workouts"
                    value={stats?.completedWorkouts || 0}
                    change={3}
                    progress={stats?.completedWorkouts / 5 * 100}
                    progressColor="bg-primary"
                  />
                  <StatsCard
                    title="Active Minutes"
                    value={stats?.activeMinutes || 0}
                    change={15}
                    progress={stats?.activeMinutes / 300 * 100}
                    progressColor="bg-orange-500"
                  />
                  <StatsCard
                    title="Goal Progress"
                    value={`${stats?.goalProgress || 0}%`}
                    progress={stats?.goalProgress || 0}
                    progressColor="bg-green-500"
                  />
                  <StatsCard
                    title="Friend Activities"
                    value={stats?.friendActivities || 0}
                    change={5}
                    progress={90}
                    progressColor="bg-neutral-500"
                  />
                </>
              )}
            </div>
            
            {/* Today's Plan Section */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Today's Plan</h2>
                  <Link href="/workouts">
                    <Button variant="secondary" size="sm">
                      View All Plans
                    </Button>
                  </Link>
                </div>
                
                {isWorkoutsLoading ? (
                  <Skeleton className="h-96" />
                ) : activeWorkout ? (
                  <WorkoutPlan workout={activeWorkout} />
                ) : (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
                    <div className="mb-4 text-5xl">💪</div>
                    <h3 className="text-lg font-medium mb-2">No Active Workout</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      Create a new workout to start tracking your fitness journey
                    </p>
                    <Link href="/workouts/new">
                      <Button>
                        <Plus className="mr-1 h-4 w-4" /> Create Workout
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Your Progress</h2>
                </div>
                
                <ProgressWidget />
              </div>
            </div>
            
            {/* Friends Activity Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Friends Activity</h2>
                <Link href="/friends">
                  <Button variant="secondary" size="sm">
                    View All Friends
                  </Button>
                </Link>
              </div>
              
              <FriendActivity />
            </div>
            
            {/* Motivational Quote */}
            <MotivationalQuote />
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
