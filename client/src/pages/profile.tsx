import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Settings,
  Trophy,
  Edit,
  LogOut,
  Medal,
  Calendar,
  Bell,
  Clock,
  Shield,
  Check
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Achievement, User as UserType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  
  // References to the form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: achievements = [], isLoading: isAchievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<UserType>) => {
      const res = await apiRequest("PUT", `/api/user`, userData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully!",
      });
      setEditMode(false);
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveProfile = () => {
    if (!user) return;
    
    const updatedUserData: Partial<UserType> = {
      name: nameRef.current?.value || user.name,
      username: usernameRef.current?.value || user.username,
      email: emailRef.current?.value || user.email,
      profilePicture: profilePicRef.current?.value || user.profilePicture,
      bio: bioRef.current?.value || user.bio,
    };
    
    updateProfileMutation.mutate(updatedUserData);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
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
      
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your account and view your achievements
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <img 
                      src={user?.profilePicture} 
                      alt={`${user?.name}'s avatar`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-sm"
                    />
                    <label 
                      className="absolute bottom-0 right-0 cursor-pointer"
                      htmlFor="profile-upload"
                    >
                      <div className="bg-secondary hover:bg-secondary/90 w-8 h-8 rounded-full flex items-center justify-center">
                        <Edit className="h-4 w-4" />
                      </div>
                      <input
                        id="profile-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('profilePicture', file);
                            
                            try {
                              const res = await fetch('/api/user/profile-picture', {
                                method: 'POST',
                                body: formData,
                                credentials: 'include'
                              });
                              
                              if (!res.ok) throw new Error('Failed to upload image');
                              
                              const data = await res.json();
                              updateProfileMutation.mutate({
                                ...user,
                                profilePicture: data.profilePicture
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to upload profile picture",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-1">{user?.name}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">@{user?.username}</p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                </div>
                
                {isStatsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-md flex items-center justify-center text-primary">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Workouts Completed</div>
                          <div className="text-2xl font-bold">{stats?.completedWorkouts || 0}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-md flex items-center justify-center text-primary">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Active Minutes</div>
                          <div className="text-2xl font-bold">{stats?.activeMinutes || 0}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-md flex items-center justify-center text-primary">
                          <Medal className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Achievements</div>
                          <div className="text-2xl font-bold">{stats?.achievements || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <Tabs defaultValue="achievements">
                <TabsList className="mb-4">
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                
                <TabsContent value="achievements">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        My Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isAchievementsLoading ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          <Skeleton className="h-24" />
                          <Skeleton className="h-24" />
                          <Skeleton className="h-24" />
                          <Skeleton className="h-24" />
                        </div>
                      ) : achievements.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {achievements.map((achievement) => (
                            <div 
                              key={achievement.id} 
                              className="border rounded-lg p-4 flex items-start gap-3"
                            >
                              <div className="bg-accent-500/10 text-accent-500 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                                {achievement.icon.includes("trophy") ? (
                                  <Trophy className="h-6 w-6" />
                                ) : (
                                  <Medal className="h-6 w-6" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium mb-1">{achievement.title}</div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                                  {achievement.description}
                                </div>
                                <div className="text-xs text-neutral-400 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(achievement.earnedAt), "MMM d, yyyy")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <div className="mb-4 text-5xl">🏆</div>
                          <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                            Complete workouts and reach goals to earn achievements
                          </p>
                          <Link href="/workouts">
                            <Button>Start Working Out</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Progress Overview */}
                  {!isStatsLoading && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Chart className="h-5 w-5 text-primary" />
                          Progress Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-40">
                            <ProgressCircle 
                              value={stats?.goalProgress || 0} 
                              size="lg"
                              color="hsl(var(--primary))"
                            />
                          </div>
                          <div className="space-y-4 flex-1">
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500 mb-1">Weekly Goal Progress</h3>
                              <div className="w-full bg-neutral-100 rounded-full h-2 dark:bg-neutral-700">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${stats?.goalProgress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500 mb-1">Workout Consistency</h3>
                              <div className="w-full bg-neutral-100 rounded-full h-2 dark:bg-neutral-700">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${(stats?.completedWorkouts / (stats?.totalWorkouts || 5)) * 100 || 0}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500 mb-1">Activity Minutes Target</h3>
                              <div className="w-full bg-neutral-100 rounded-full h-2 dark:bg-neutral-700">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${(stats?.activeMinutes / 300) * 100 || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                              id="name" 
                              defaultValue={user?.name || ''}
                              disabled={!editMode}
                              ref={nameRef}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                              id="username" 
                              defaultValue={user?.username || ''} 
                              disabled={!editMode}
                              ref={usernameRef}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              defaultValue={user?.email || ''} 
                              disabled={!editMode}
                              ref={emailRef}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profile-pic">Profile Picture URL</Label>
                            <Input 
                              id="profile-pic" 
                              defaultValue={user?.profilePicture || ''} 
                              disabled={!editMode}
                              ref={profilePicRef}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea 
                            id="bio" 
                            placeholder="Tell us about yourself and your fitness goals"
                            defaultValue={user?.bio || ''}
                            disabled={!editMode}
                            rows={4}
                            ref={bioRef}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          {editMode ? (
                            <>
                              <Button variant="outline" onClick={() => setEditMode(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                                {updateProfileMutation.isPending ? (
                                  <span className="flex items-center gap-1">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-4 w-4" /> Save Changes
                                  </span>
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => setEditMode(true)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                          )}
                        </div>
                      </form>
                      
                      <Separator className="my-6" />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Password</h3>
                        <Button variant="outline">Change Password</Button>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Shield className="h-5 w-5 mr-2 text-red-500" />
                          Danger Zone
                        </h3>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Notification Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Workout Reminders</div>
                                <div className="text-sm text-neutral-500">Get reminded about scheduled workouts</div>
                              </div>
                              <Switch />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Friend Requests</div>
                                <div className="text-sm text-neutral-500">Receive emails about new friend requests</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Goal Updates</div>
                                <div className="text-sm text-neutral-500">Updates about your goal progress</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Newsletter</div>
                                <div className="text-sm text-neutral-500">Monthly fitness tips and updates</div>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">App Notifications</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Friend Activities</div>
                                <div className="text-sm text-neutral-500">See when friends complete workouts</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Achievements</div>
                                <div className="text-sm text-neutral-500">Notifications when you earn achievements</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Workout Reminders</div>
                                <div className="text-sm text-neutral-500">Daily reminders to complete workouts</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button>Save Preferences</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}

function Chart(props: React.ComponentProps<typeof Trophy>) {
  return <Trophy {...props} />;
}
