import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Award, Trophy, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Achievement } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgressWidget() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  const { data: achievements = [], isLoading: isAchievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });
  
  const recentAchievements = achievements.slice(0, 2);
  
  if (isStatsLoading) {
    return (
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="pt-4 border-t dark:border-neutral-700">
          <Skeleton className="h-6 w-1/3 mb-3" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      <div className="flex flex-col items-center">
        <div className="font-bold text-center text-2xl text-primary mb-2 font-serif">Weekly Goal</div>
        <div className="relative mb-4">
          <ProgressCircle 
            value={stats?.goalProgress || 0} 
            size="lg" 
            color="hsl(var(--success))"
          />
        </div>
        
        <div className="w-full mt-2">
          <div className="text-sm flex justify-between mb-1">
            <span>Weekly target: {stats?.totalWorkouts || 0} workouts</span>
            <span>{stats?.completedWorkouts || 0}/{stats?.totalWorkouts || 5} done</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 dark:bg-neutral-700">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${stats?.goalProgress || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t pt-4 dark:border-neutral-700">
        <div className="font-medium mb-3">Recent Achievements</div>
        
        {isAchievementsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentAchievements.length > 0 ? (
          recentAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center gap-3 mb-3">
              <div className="bg-accent-500/10 text-accent-500 w-10 h-10 rounded-full flex items-center justify-center">
                {achievement.icon.includes("trophy") ? (
                  <Trophy className="h-5 w-5" />
                ) : (
                  <Award className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="font-medium">{achievement.title}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {achievement.description}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-neutral-500">
            <Award className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
            <p>Complete workouts to earn achievements!</p>
          </div>
        )}
        
        <Button variant="secondary" size="sm" className="w-full mt-2">
          <Calendar className="mr-2 h-4 w-4" /> View History
        </Button>
      </div>
    </Card>
  );
}
