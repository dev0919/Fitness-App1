import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, MessageSquare, Award, CalendarClock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
}

interface FeedActivity {
  id: number;
  type: string;
  content: string;
  timestamp: string;
  user: ActivityUser;
  metadata: any;
}

export default function Feed() {
  const { user } = useAuth();
  
  const { data: activities = [], isLoading } = useQuery<FeedActivity[]>({
    queryKey: ["/api/activities"],
  });
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return '🔥';
      case 'goal_achieved':
        return '🎯';
      case 'workout_created':
        return '💪';
      case 'friend_added':
        return '👋';
      default:
        return '📣';
    }
  };
  
  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return 'Completed Workout';
      case 'goal_achieved':
        return 'Reached Goal';
      case 'workout_created':
        return 'Started New Workout';
      case 'friend_added':
        return 'Made a New Friend';
      default:
        return 'New Activity';
    }
  };
  
  const getFormattedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    // If it's today, show relative time (e.g., "2 hours ago")
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // If it's within the last week, show day of week and time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return format(date, 'EEEE, h:mm a');
    }
    
    // Otherwise show full date
    return format(date, 'MMM d, yyyy');
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
  
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <Sidebar />
      
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                See what you and your friends have been up to
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <CalendarClock className="mr-1 h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b dark:border-neutral-700 flex items-center gap-3">
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={activity.user.profilePicture} 
                        alt={`${activity.user.name}'s avatar`} 
                      />
                      <div>
                        <div className="font-medium">{activity.user.name}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {getFormattedTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-medium mb-2">
                        {getActivityIcon(activity.type)} {getActivityTitle(activity.type)}
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                        {activity.content}
                      </p>
                      <div className="flex justify-between text-sm">
                        <Button variant="ghost" size="sm" className="gap-1 text-neutral-500 hover:text-primary">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Like</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-neutral-500 hover:text-primary">
                          <MessageSquare className="h-4 w-4" />
                          <span>Comment</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-neutral-500 hover:text-primary">
                          <Award className="h-4 w-4" />
                          <span>Cheer</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center">
              <div className="mb-4 text-5xl">📱</div>
              <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Complete workouts and connect with friends to see activities here
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/workouts">
                  <Button>
                    Start a Workout
                  </Button>
                </Link>
                <Link href="/friends">
                  <Button variant="outline">
                    Find Friends
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
