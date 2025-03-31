import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Workouts from "@/pages/workouts";
import Goals from "@/pages/goals";
import Friends from "@/pages/friends";
import Feed from "@/pages/feed";
import Profile from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/workouts" component={Workouts} />
      <ProtectedRoute path="/goals" component={Goals} />
      <ProtectedRoute path="/friends" component={Friends} />
      <ProtectedRoute path="/feed" component={Feed} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
