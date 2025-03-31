import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WorkoutPlan } from "@/components/dashboard/workout-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Workout } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

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
  
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.title.toLowerCase().includes(searchTerm.toLowerCase());
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
  
  const NewWorkoutForm = () => (
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
      
      <Card className="p-6">
        <div className="text-center p-10">
          <div className="mb-4 text-5xl">🚧</div>
          <h2 className="text-xl font-medium mb-2">Coming Soon</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            The workout creation feature is under development.
          </p>
          <Button onClick={() => setLocation("/workouts")}>
            Return to Workouts
          </Button>
        </div>
      </Card>
    </>
  );
  
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
