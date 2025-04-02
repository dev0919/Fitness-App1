import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  BarChart3, 
  Flag, 
  Heart, 
  LogOut, 
  Settings, 
  Trophy, 
  User, 
  Users
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/workouts", label: "Workouts", icon: <Heart className="h-5 w-5" /> },
    { href: "/goals", label: "Goals", icon: <Flag className="h-5 w-5" /> },
    { href: "/friends", label: "Friends", icon: <Users className="h-5 w-5" /> },
    { href: "/feed", label: "Activity Feed", icon: <Activity className="h-5 w-5" /> },
    { href: "/stats", label: "Statistics", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white dark:bg-neutral-800 dark:border-neutral-700 md:flex">
      <div className="flex h-14 items-center border-b px-4 dark:border-neutral-700">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">Fitness Buddy</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-auto py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Main
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    location === item.href
                      ? "bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-500"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Personal
          </h2>
          <div className="space-y-1">
            <Link href="/profile">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  location === "/profile"
                    ? "bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-500"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                )}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </div>
            </Link>
            <Link href="/achievements">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  location === "/achievements"
                    ? "bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-500"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                )}
              >
                <Trophy className="h-5 w-5" />
                <span>Achievements</span>
              </div>
            </Link>
            <Link href="/settings">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  location === "/settings"
                    ? "bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-500"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                )}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="border-t p-4 dark:border-neutral-700">
        <div className="flex items-center gap-4">
          <img 
            alt="User avatar" 
            className="h-10 w-10 rounded-full object-cover" 
            src={user.profilePicture || 'https://via.placeholder.com/40'} 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
              {user.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user.email}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
