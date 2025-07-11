import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import StatisticsPage from "@/pages/statistics-page";
import InventoryPage from "@/pages/inventory-page"
import NotFound from "@/pages/not-found";
import TransactionsPage from '@/pages/transactions-page.tsx'
import LogPage from '@/pages/log-page.tsx'
import JackpotPage from "@/pages/jackpot-page";
import GroupsPage from "@/pages/groups-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path={"/jackpot"} component={JackpotPage} />
      <ProtectedRoute path="/stats" component={StatisticsPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/log" component={LogPage} />
      <ProtectedRoute path="/inventory" component={InventoryPage} />
      <ProtectedRoute path={"/groups"} component={GroupsPage} />
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