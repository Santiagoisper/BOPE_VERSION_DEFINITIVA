import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrdersProvider } from "@/context/OrdersContext";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Missions from "@/pages/Missions";
import Arsenal from "@/pages/Arsenal";
import Records from "@/pages/Records";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-amber mb-2">404</div>
        <div className="text-sm font-mono text-muted-foreground">Ruta no encontrada</div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/agents" component={Agents} />
        <Route path="/missions" component={Missions} />
        <Route path="/arsenal" component={Arsenal} />
        <Route path="/records" component={Records} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </OrdersProvider>
    </QueryClientProvider>
  );
}

export default App;
