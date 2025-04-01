import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WorkoutPlan } from "@/components/dashboard/workout-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, ArrowLeft, Copy, CheckCircle2, Clock, Dumbbell, Trophy } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Workout, InsertWorkout } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function Workouts() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Check if we're on the new workout route
  const isNewWorkoutRoute = location === "/workouts/new";
  
  const { data: workouts = [], isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });
  
  const { data: templateWorkouts = [], isLoading: isLoadingTemplates } = useQuery<Workout[]>({
    queryKey: ["/api/workouts/templates"],
  });
  
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && !workout.completed) || 
                      (activeTab === "completed" && workout.completed);
    
    return matchesSearch && matchesTab;
  });
  
  // Header with sticky mobile top bar
  const Header = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden dark:bg-neutral-800 dark:border-neutral-700">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="text-primary text-2xl">⚡</div>
        <span className="text-lg font-bold text-primary">Fitness Buddy</span>
      </Link>
    </header>
  );
  
  const WorkoutsList = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Workouts</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Manage and track your fitness routines
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
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Search workouts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Workouts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : filteredWorkouts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredWorkouts.map((workout) => (
            <WorkoutPlan key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <div className="mb-4 text-5xl">🏋️‍♂️</div>
          <h3 className="text-lg font-medium mb-2">No Workouts Found</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {searchTerm 
              ? "No workouts match your search criteria." 
              : "You haven't created any workouts yet."}
          </p>
          <Link href="/workouts/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Create Workout
            </Button>
          </Link>
        </Card>
      )}
    </>
  );
  
  // Create workout validation schema
  const createWorkoutSchema = z.object({
    name: z.string().min(3, { message: "Workout name must be at least 3 characters" }),
    description: z.string().optional(),
    type: z.string().min(1, { message: "Please select a workout type" }),
    duration: z.coerce.number().min(1, { message: "Duration must be at least 1 minute" }),
    difficulty: z.string().min(1, { message: "Please select a difficulty level" }),
  });

  // Clone workout mutation
  const { toast } = useToast();
  
  const cloneWorkoutMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const res = await apiRequest("POST", `/api/workouts/clone/${templateId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Workout cloned successfully",
        description: "The workout has been added to your workout list",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setLocation("/workouts");
    },
    onError: (error) => {
      toast({
        title: "Error cloning workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async (workout: InsertWorkout) => {
      const res = await apiRequest("POST", "/api/workouts", workout);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Workout created successfully",
        description: "Your new workout has been created",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setLocation("/workouts");
    },
    onError: (error) => {
      toast({
        title: "Error creating workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const NewWorkoutForm = () => {
    const form = useForm<z.infer<typeof createWorkoutSchema>>({
      resolver: zodResolver(createWorkoutSchema),
      defaultValues: {
        name: "",
        description: "",
        type: "",
        duration: 30,
        difficulty: "",
      },
    });
    
    const onSubmit = (values: z.infer<typeof createWorkoutSchema>) => {
      createWorkoutMutation.mutate({
        ...values,
        userId: user?.id || 0
      });
    };
    
    const [activeTab, setActiveTab] = useState("create");
    
    return (
      <>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={() => setLocation("/workouts")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Workout</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Custom</TabsTrigger>
            <TabsTrigger value="templates">Use Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Custom Workout</CardTitle>
                <CardDescription>
                  Build your own workout routine from scratch
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workout Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Morning HIIT Blast" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the workout..." 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Workout Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="strength">Strength</SelectItem>
                                <SelectItem value="cardio">Cardio</SelectItem>
                                <SelectItem value="flexibility">Flexibility</SelectItem>
                                <SelectItem value="hiit">HIIT</SelectItem>
                                <SelectItem value="crossfit">CrossFit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={createWorkoutMutation.isPending}
                      >
                        {createWorkoutMutation.isPending ? (
                          <>
                            <span className="mr-2">Creating...</span>
                            <span className="animate-spin">⭮</span>
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Create Workout
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-2">Workout Templates</h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                Start with a pre-made workout template and customize it to fit your needs
              </p>
            </div>
            
            {isLoadingTemplates ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : templateWorkouts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateWorkouts.map((template) => (
                  <Card key={template.id} className="overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-bold text-lg">{template.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {template.type}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {template.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-2 flex-grow">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{template.duration} minutes</span>
                      </div>
                      
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        disabled={cloneWorkoutMutation.isPending}
                        onClick={() => cloneWorkoutMutation.mutate(template.id)}
                      >
                        {cloneWorkoutMutation.isPending ? (
                          <>
                            <span className="mr-2">Cloning...</span>
                            <span className="animate-spin">⭮</span>
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" /> Use Template
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-10 text-center">
                <div className="mb-4 text-5xl">🏋️‍♀️</div>
                <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  There are no workout templates available at this time.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </>
    );
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <Sidebar />
      
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">
          {isNewWorkoutRoute ? <NewWorkoutForm /> : <WorkoutsList />}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
