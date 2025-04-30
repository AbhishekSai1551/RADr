import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { SocketProvider } from "./hooks/use-socket";
import { ProtectedRoute } from "./lib/protected-route";
import { DynamicBackground } from "@/components/dynamic-background";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DiscoverPage from "@/pages/discover-page";
import ProfilePage from "@/pages/profile-page";
import ZonesPage from "@/pages/zones-page";
import ConnectionsPage from "@/pages/connections-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DiscoverPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/zones" component={ZonesPage} />
      <ProtectedRoute path="/connections" component={ConnectionsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen">
            <Router />
            <Toaster />
          </div>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
