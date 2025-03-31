import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { AuthCard } from "@/components/ui/auth-card";
import { Activity } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  
  // If user is logged in, redirect to dashboard
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Column */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <Activity className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Fitness Buddy</h1>
            </div>
          </div>
          <AuthCard />
        </div>
      </div>
      
      {/* Hero Column */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-400 text-white p-10 flex-col justify-center">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4 font-serif">Connect, Train, Achieve</h1>
          <p className="text-lg mb-6">
            Fitness Buddy connects you with like-minded fitness enthusiasts who share your goals and passion for a healthy lifestyle.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Track Your Progress</h3>
                <p>Set goals, log workouts, and monitor your fitness journey with intuitive tools.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Connect with Friends</h3>
                <p>Share achievements, give encouragement, and build a supportive fitness community.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">Stay Motivated</h3>
                <p>Celebrate milestones, earn achievements, and keep pushing toward your fitness goals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
