import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import BattleHistoryPage from "@/pages/BattleHistoryPage";
import InventoryPage from "@/pages/InventoryPage";
import SettingsPage from "@/pages/SettingsPage";
import CultivatePage from "@/pages/CultivatePage";
import GuildsPage from "@/pages/GuildsPage";
import GuildDetailPage from "@/pages/GuildDetailPage";
import MemoriesPage from "@/pages/MemoriesPage";
import WorldStatePage from "@/pages/WorldStatePage";
import SkillsPage from "@/pages/SkillsPage";
import FactionsPage from "@/pages/FactionsPage";
import MarketPage from "@/pages/MarketPage";
import AdminPage from "@/pages/AdminPage";
import NPCsPage from "@/pages/NPCsPage";
import WorldCreatorPage from "@/pages/WorldCreatorPage";
import WorldDiscoverPage from "@/pages/WorldDiscoverPage";
import MultiversePage from "@/pages/MultiversePage";
import PvPPage from "@/pages/PvPPage";
import AchievementsPage from "@/pages/AchievementsPage";
import DailyPage from "@/pages/DailyPage";
import DungeonPage from "@/pages/DungeonPage";
import CraftPage from "@/pages/CraftPage";
import GuildWarPage from "@/pages/GuildWarPage";
import FeedPage from "@/pages/FeedPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

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
      <Route path="/battle/history" component={BattleHistoryPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/battle" component={BattlePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/cultivate" component={CultivatePage} />
      <Route path="/guilds" component={GuildsPage} />
      <Route path="/guilds/:id" component={GuildDetailPage} />
      <Route path="/memories" component={MemoriesPage} />
      <Route path="/world/:slug/state" component={WorldStatePage} />
      <Route path="/skills" component={SkillsPage} />
      <Route path="/factions" component={FactionsPage} />
      <Route path="/market" component={MarketPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/npcs" component={NPCsPage} />
      <Route path="/world-creator" component={WorldCreatorPage} />
      <Route path="/world-discover" component={WorldDiscoverPage} />
      <Route path="/multiverse" component={MultiversePage} />
      <Route path="/pvp" component={PvPPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/daily" component={DailyPage} />
      <Route path="/dungeon" component={DungeonPage} />
      <Route path="/craft" component={CraftPage} />
      <Route path="/guild-war" component={GuildWarPage} />
      <Route path="/feed" component={FeedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
