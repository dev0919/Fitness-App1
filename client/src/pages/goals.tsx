import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Flag, Plus, Calendar, Target, Dumbbell, Weight, Timer, X } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal, InsertGoal } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [goalData, setGoalData] = useState({
    title: "",
    description: "",
    type: "workout_count",
    target: 5,
    deadline: ""
  });
  
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: InsertGoal) => {
      const res = await apiRequest("POST", "/api/goals", newGoal);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Goal Created",
        description: "Your new goal has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setNewGoalOpen(false);
      setGoalData({
        title: "",
        description: "",
        type: "workout_count",
        target: 5,
        deadline: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateGoal = () => {
    if (!goalData.title) {
      toast({
        title: "Missing Information",
        description: "Please enter a title for your goal",
        variant: "destructive",
      });
      return;
    }
    
    const newGoal: InsertGoal = {
      userId: user!.id,
      title: goalData.title,
      description: goalData.description,
      type: goalData.type,
      target: Number(goalData.target),
      deadline: goalData.deadline ? goalData.deadline : null,
    };
    
    createGoalMutation.mutate(newGoal);
  };
  
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
  
  const formatDeadline = (date: string | Date | null | undefined) => {
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
    const [updateOpen, setUpdateOpen] = useState(false);
    const [progressValue, setProgressValue] = useState(goal.current || 0);
    const currentVal = goal.current || 0;
    const progress = (currentVal / goal.target) * 100;
    
    const updateGoalMutation = useMutation({
      mutationFn: async ({ id, current }: { id: number; current: number }) => {
        const res = await apiRequest("PUT", `/api/goals/${id}`, { current });
        return res.json();
      },
      onSuccess: () => {
        toast({
          title: "Progress Updated",
          description: "Your goal progress has been updated!",
        });
        setUpdateOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      },
      onError: (error) => {
        toast({
          title: "Failed to update progress",
          description: error.message,
          variant: "destructive",
        });
      },
    });
    
    const handleUpdateProgress = () => {
      updateGoalMutation.mutate({ id: goal.id, current: progressValue });
    };
    
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
                  <Button size="sm" onClick={() => setUpdateOpen(true)}>
                    Update Progress
                  </Button>
                )}
                
                {goal.completed && (
                  <span className="text-sm text-green-500 font-medium">
                    Completed
                  </span>
                )}
                
                {/* Update Progress Dialog */}
                <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Update Progress: {goal.title}</DialogTitle>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-4 top-4"
                        onClick={() => setUpdateOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="mb-4">
                        <p className="text-sm text-neutral-500 mb-2">
                          Current progress: {goal.current || 0} / {goal.target}
                        </p>
                        <Progress value={progress} className="mb-3" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="progress-value">New Progress Value</Label>
                        <Input 
                          id="progress-value" 
                          type="number"
                          min="0"
                          max={goal.target}
                          value={progressValue}
                          onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUpdateProgress} disabled={updateGoalMutation.isPending}>
                        {updateGoalMutation.isPending ? "Updating..." : "Update Progress"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
              <Button onClick={() => setNewGoalOpen(true)}>
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
                  <Button onClick={() => setNewGoalOpen(true)}>
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
      
      {/* New Goal Dialog */}
      <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={() => setNewGoalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input 
                id="title" 
                placeholder="E.g. Complete 10 workouts"
                value={goalData.title}
                onChange={(e) => setGoalData({...goalData, title: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Describe your goal..."
                value={goalData.description}
                onChange={(e) => setGoalData({...goalData, description: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Goal Type</Label>
              <Select 
                value={goalData.type}
                onValueChange={(value) => setGoalData({...goalData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout_count">
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      <span>Workout Count</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="weight">
                    <div className="flex items-center">
                      <Weight className="h-4 w-4 mr-2" />
                      <span>Weight Goal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="time">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-2" />
                      <span>Time-based Goal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      <span>Custom Goal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="target">Target Value</Label>
              <Input 
                id="target" 
                type="number"
                min="1"
                value={goalData.target}
                onChange={(e) => setGoalData({...goalData, target: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input 
                id="deadline" 
                type="date"
                value={goalData.deadline}
                onChange={(e) => setGoalData({...goalData, deadline: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGoal} disabled={createGoalMutation.isPending}>
              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
