import { Link, useLocation } from "wouter";
import { Activity, BarChart3, Flag, Heart, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: <BarChart3 className="text-xl" /> },
    { href: "/workouts", label: "Workouts", icon: <Heart className="text-xl" /> },
    { href: "/feed", label: "Feed", icon: <Activity className="text-xl" /> },
    { href: "/goals", label: "Goals", icon: <Flag className="text-xl" /> },
    { href: "/profile", label: "Profile", icon: <User className="text-xl" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-neutral-800 dark:border-neutral-700 z-20">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => {
          // Check if this is the middle item for the add button
          const isMiddle = index === Math.floor(navItems.length / 2);
          
          if (isMiddle) {
            return (
              <Link key={item.href} href="/workouts/new">
                <a className="flex flex-col items-center justify-center">
                  <div className="bg-primary text-white rounded-full h-12 w-12 flex items-center justify-center -mt-6">
                    <Plus className="text-xl" />
                  </div>
                </a>
              </Link>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex flex-col items-center justify-center",
                location === item.href
                  ? "text-primary"
                  : "text-neutral-500 dark:text-neutral-400"
              )}>
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
