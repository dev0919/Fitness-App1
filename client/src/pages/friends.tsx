import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  UserPlus, 
  Check, 
  X, 
  User, 
  UserCheck, 
  Clock 
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FriendUser {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
}

interface FriendConnection {
  id: number;
  status: string;
  friend: FriendUser | null;
  isRequester: boolean;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [addFriendUsername, setAddFriendUsername] = useState("");
  
  const { data: friends = [], isLoading } = useQuery<FriendConnection[]>({
    queryKey: ["/api/friends"],
  });
  
  const acceptFriendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/friends/${id}`, { status: "accepted" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request accepted",
        description: "You are now connected with this friend.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to accept friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const rejectFriendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/friends/${id}`, { status: "rejected" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request rejected",
        description: "The friend request has been declined.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reject friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addFriendMutation = useMutation({
    mutationFn: async (username: string) => {
      // First get the user ID from the username
      const res = await apiRequest("POST", `/api/friends`, { friendId: parseInt(username) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setAddFriendUsername("");
      toast({
        title: "Friend request sent",
        description: "Your request has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const pendingRequests = friends.filter(f => 
    f.status === "pending" && !f.isRequester
  );
  
  const sentRequests = friends.filter(f => 
    f.status === "pending" && f.isRequester
  );
  
  const acceptedFriends = friends.filter(f => 
    f.status === "accepted"
  ).filter(f => 
    f.friend && f.friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAcceptFriend = (id: number) => {
    acceptFriendMutation.mutate(id);
  };
  
  const handleRejectFriend = (id: number) => {
    rejectFriendMutation.mutate(id);
  };
  
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (addFriendUsername.trim()) {
      addFriendMutation.mutate(addFriendUsername);
    }
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
              <h1 className="text-2xl font-bold tracking-tight">My Friends</h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Connect with other fitness enthusiasts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form onSubmit={handleAddFriend} className="flex gap-2">
                <Input
                  placeholder="Enter friend ID"
                  value={addFriendUsername}
                  onChange={(e) => setAddFriendUsername(e.target.value)}
                  className="w-40"
                />
                <Button type="submit" disabled={addFriendMutation.isPending}>
                  <UserPlus className="mr-1 h-4 w-4" /> Add
                </Button>
              </form>
            </div>
          </div>
          
          {pendingRequests.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-500" />
                  Pending Friend Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={request.friend?.profilePicture || "https://via.placeholder.com/40"} 
                          alt={`${request.friend?.name || 'User'}'s profile`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{request.friend?.name || 'Unknown User'}</div>
                          <div className="text-sm text-neutral-500">@{request.friend?.username}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptFriend(request.id)}
                          disabled={acceptFriendMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectFriend(request.id)}
                          disabled={rejectFriendMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Tabs defaultValue="friends" className="mb-6">
            <TabsList>
              <TabsTrigger value="friends">My Friends</TabsTrigger>
              <TabsTrigger value="sent">Sent Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends" className="mt-6">
              <div className="relative flex-1 mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <Input
                  placeholder="Search friends..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : acceptedFriends.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {acceptedFriends.map(friend => (
                    <Card key={friend.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={friend.friend?.profilePicture || "https://via.placeholder.com/60"} 
                            alt={`${friend.friend?.name || 'User'}'s profile`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{friend.friend?.name}</h3>
                            <p className="text-sm text-neutral-500">@{friend.friend?.username}</p>
                            <div className="flex items-center mt-2 text-sm text-green-500">
                              <UserCheck className="h-4 w-4 mr-1" /> Connected
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <div className="mb-4 text-5xl">👥</div>
                  <h3 className="text-lg font-medium mb-2">No Friends Yet</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Connect with other fitness enthusiasts to share your journey
                  </p>
                  <Button>
                    <UserPlus className="mr-1 h-4 w-4" /> Find Friends
                  </Button>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="sent" className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map(request => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={request.friend?.profilePicture || "https://via.placeholder.com/40"} 
                              alt={`${request.friend?.name || 'User'}'s profile`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium">{request.friend?.name || 'Unknown User'}</div>
                              <div className="text-sm text-neutral-500">@{request.friend?.username}</div>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-orange-500">
                            <Clock className="h-4 w-4 mr-1" /> Pending
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <div className="mb-4 text-5xl">📨</div>
                  <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    You don't have any outgoing friend requests at the moment
                  </p>
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
