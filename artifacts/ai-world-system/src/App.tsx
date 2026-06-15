import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import WorldsPage from "@/pages/WorldsPage";
import CharacterCreationPage from "@/pages/CharacterCreationPage";
import DashboardPage from "@/pages/DashboardPage";
import PlayPage from "@/pages/PlayPage";
import CharacterProfilePage from "@/pages/CharacterProfilePage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import BattlePage from "@/pages/BattlePage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/worlds" component={WorldsPage} />
      <Route path="/create-character/:worldId" component={CharacterCreationPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/play" component={PlayPage} />
      <Route path="/character/:id" component={CharacterProfilePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/battle" component={BattlePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
