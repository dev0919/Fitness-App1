import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Flag, Plus, Calendar, Target, Dumbbell, Weight, Timer } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Goals() {
  const { user } = useAuth();
  
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);
  
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'workout_count':
        return <Dumbbell className="h-5 w-5" />;
      case 'weight':
        return <Weight className="h-5 w-5" />;
      case 'time':
        return <Timer className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };
  
  const formatDeadline = (date: string | null | undefined) => {
    if (!date) return "No deadline";
    return format(new Date(date), "MMM d, yyyy");
  };
  
  // Header with sticky mobile top bar
  const Header = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden dark:bg-neutral-800 dark:border-neutral-700">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="text-primary text-2xl">⚡</div>
        <span className="text-lg font-bold text-primary">Fitness Buddy</span>
      </Link>
    </header>
  );
  
  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progress = (goal.current / goal.target) * 100;
    
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-md flex items-center justify-center text-primary">
                {getGoalIcon(goal.type)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">{goal.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                {goal.description || "No description"}
              </p>
              
              <div className="flex justify-between text-sm mb-1">
                <span>Progress: {goal.current} / {goal.target}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="mb-3" />
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-neutral-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDeadline(goal.deadline)}
                </div>
                
                {!goal.completed && (
                  <Button size="sm">Update Progress</Button>
                )}
                
                {goal.completed && (
                  <span className="text-sm text-green-500 font-medium">
                    Completed
                  </span>
                )}
              </div>
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
              <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Track and achieve your fitness goals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New Goal
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="active" className="mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Goals</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <div className="mb-4 text-5xl">🎯</div>
                  <h3 className="text-lg font-medium mb-2">No Active Goals</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Set goals to track your fitness progress and stay motivated
                  </p>
                  <Button>
                    <Plus className="mr-1 h-4 w-4" /> Create Goal
                  </Button>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : completedGoals.length > 0 ? (
                <div className="space-y-4">
                  {completedGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <div className="mb-4 text-5xl">🏆</div>
                  <h3 className="text-lg font-medium mb-2">No Completed Goals Yet</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Complete your active goals to see them here
                  </p>
                  <Button variant="secondary">
                    <Flag className="mr-1 h-4 w-4" /> View Active Goals
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
