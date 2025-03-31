import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Dumbbell, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Workout, Exercise } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface WorkoutPlanProps {
  workout: Workout;
}

export function WorkoutPlan({ workout }: WorkoutPlanProps) {
  const { toast } = useToast();
  
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: [`/api/workouts/${workout.id}/exercises`],
  });
  
  const completedExercises = exercises.filter(exercise => exercise.completed).length;
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  
  const markExerciseMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PUT", `/api/exercises/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workouts/${workout.id}/exercises`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/workouts/${workout.id}`, { completed: true });
    },
    onSuccess: () => {
      toast({
        title: "Workout Completed",
        description: "Great job! Your workout has been marked as complete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to complete workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleMarkComplete = (exerciseId: number, currentStatus: boolean) => {
    markExerciseMutation.mutate({ id: exerciseId, completed: !currentStatus });
  };
  
  return (
    <Card className="h-full">
      <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center">
        <div>
          <h3 className="font-medium">{workout.title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {workout.duration} min • {workout.difficulty}
          </p>
        </div>
        <div className="flex gap-2">
          <ProgressCircle 
            value={progress} 
            size="sm" 
            color="hsl(var(--primary))"
          />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {exercises.map((exercise) => (
          <div 
            key={exercise.id} 
            className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-md flex items-center justify-center text-primary">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{exercise.name}</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {exercise.sets} sets x {exercise.reps} reps
                </p>
              </div>
            </div>
            
            {exercise.completed ? (
              <div className="flex items-center">
                <CheckCircle2 className="text-green-500 mr-2 h-5 w-5" />
                <span className="text-sm text-green-500">Completed</span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleMarkComplete(exercise.id, exercise.completed)}
                disabled={markExerciseMutation.isPending}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark
              </Button>
            )}
          </div>
        ))}
        
        {exercises.length === 0 && (
          <div className="py-4 text-center text-neutral-500">
            No exercises found for this workout.
          </div>
        )}
      </div>
      
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t dark:border-neutral-700 flex justify-between items-center">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {completedExercises} of {totalExercises} exercises completed
        </div>
        <Button 
          onClick={() => startWorkoutMutation.mutate()}
          disabled={startWorkoutMutation.isPending || workout.completed}
        >
          {workout.completed ? "Completed" : "Start Workout"}
        </Button>
      </div>
    </Card>
  );
}
