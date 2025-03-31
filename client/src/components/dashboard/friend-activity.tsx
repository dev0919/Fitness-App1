import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

export function FriendActivity() {
  const { data: activities = [] } = useQuery<FeedActivity[]>({
    queryKey: ["/api/activities"],
  });

  // Show only the 3 most recent activities
  const recentActivities = activities.slice(0, 3);

  const getFormattedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {recentActivities.map((activity) => (
        <Card key={activity.id}>
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
              {activity.type === "workout_completed" && "Completed Workout 🔥"}
              {activity.type === "goal_achieved" && "Reached Goal 🎯"}
              {activity.type === "workout_created" && "Started New Workout 💪"}
              {activity.type === "friend_added" && "Made a New Friend 👋"}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
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
        </Card>
      ))}
      
      {recentActivities.length === 0 && (
        <Card className="col-span-full p-6 text-center">
          <div className="text-neutral-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-lg font-medium mb-1">No activity yet</p>
            <p className="text-sm">Connect with friends to see their fitness activities.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
