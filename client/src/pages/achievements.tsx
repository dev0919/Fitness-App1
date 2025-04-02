import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Trophy, Medal, Award, Star, Crown, Check } from "lucide-react";
import { Link } from "wouter";
import { Achievement } from "@shared/schema";

export default function Achievements() {
  const { user } = useAuth();

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  // Helper function to get achievement icons
  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case "ri-trophy-line":
        return <Trophy className="h-6 w-6" />;
      case "ri-medal-line":
        return <Medal className="h-6 w-6" />;
      case "ri-award-line":
        return <Award className="h-6 w-6" />;
      case "ri-star-line":
        return <Star className="h-6 w-6" />;
      case "ri-crown-line":
        return <Crown className="h-6 w-6" />;
      default:
        return <Check className="h-6 w-6" />;
    }
  };

  // Format date 
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Unknown";
    return format(new Date(date), "MMM d, yyyy");
  };

  // Group achievements by type
  const groupedAchievements = {
    workout: achievements?.filter((a) => a.title.toLowerCase().includes("workout")) || [],
    goal: achievements?.filter((a) => a.title.toLowerCase().includes("goal")) || [],
    streak: achievements?.filter((a) => a.title.toLowerCase().includes("streak")) || [],
    other: achievements?.filter((a) => 
      !a.title.toLowerCase().includes("workout") && 
      !a.title.toLowerCase().includes("goal") && 
      !a.title.toLowerCase().includes("streak")
    ) || [],
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

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 dark:bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
            {getAchievementIcon(achievement.icon)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">{achievement.title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              {achievement.description}
            </p>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Earned on {formatDate(achievement.earnedAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <Sidebar />

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Track your fitness milestones and accomplishments
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {achievements && achievements.length > 0 ? (
                <Tabs defaultValue="all" className="mb-6">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="workout">Workout</TabsTrigger>
                    <TabsTrigger value="goal">Goal</TabsTrigger>
                    <TabsTrigger value="streak">Streak</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {achievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="workout" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedAchievements.workout.length > 0 ? (
                        groupedAchievements.workout.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))
                      ) : (
                        <Card className="col-span-full p-10 text-center">
                          <div className="mb-4 text-5xl">🏋️</div>
                          <h3 className="text-lg font-medium mb-2">No Workout Achievements Yet</h3>
                          <p className="text-neutral-500 dark:text-neutral-400 mb-4 max-w-md mx-auto">
                            Complete workouts to earn achievements in this category
                          </p>
                          <Link href="/workouts" className="text-primary font-medium hover:underline">
                            Go to Workouts
                          </Link>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="goal" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedAchievements.goal.length > 0 ? (
                        groupedAchievements.goal.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))
                      ) : (
                        <Card className="col-span-full p-10 text-center">
                          <div className="mb-4 text-5xl">🎯</div>
                          <h3 className="text-lg font-medium mb-2">No Goal Achievements Yet</h3>
                          <p className="text-neutral-500 dark:text-neutral-400 mb-4 max-w-md mx-auto">
                            Achieve your fitness goals to earn achievements in this category
                          </p>
                          <Link href="/goals" className="text-primary font-medium hover:underline">
                            Go to Goals
                          </Link>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="streak" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedAchievements.streak.length > 0 ? (
                        groupedAchievements.streak.map((achievement) => (
                          <AchievementCard key={achievement.id} achievement={achievement} />
                        ))
                      ) : (
                        <Card className="col-span-full p-10 text-center">
                          <div className="mb-4 text-5xl">🔥</div>
                          <h3 className="text-lg font-medium mb-2">No Streak Achievements Yet</h3>
                          <p className="text-neutral-500 dark:text-neutral-400 mb-4 max-w-md mx-auto">
                            Maintain workout consistency to earn streak achievements
                          </p>
                          <Link href="/workouts" className="text-primary font-medium hover:underline">
                            Go to Workouts
                          </Link>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="p-10 text-center max-w-2xl mx-auto">
                  <div className="mb-4 text-5xl">🏆</div>
                  <h3 className="text-xl font-medium mb-2">No Achievements Yet</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                    Complete workouts, achieve goals, and maintain workout consistency to earn achievements
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/workouts" className="text-primary font-medium hover:underline">
                      Start a Workout
                    </Link>
                    <Link href="/goals" className="text-primary font-medium hover:underline">
                      Set a Goal
                    </Link>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}