import { Toaster } from "@/components/ui/sonner";
import { BudgetProvider } from "./contexts/BudgetContext";
import { PersonProvider } from "./contexts/PersonContext";
import { PersonFilterProvider } from "./contexts/PersonFilterContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useMonthRollover } from "@/hooks/useMonthRollover";
// Pages
import Home from "./pages/Home";
import GelirGider from "./pages/GelirGider";
import BorcOdemeler from "./pages/BorcOdemeler";
import Hedef from "./pages/Hedef";
import Raporlar from "./pages/Raporlar";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DesignShowcase from "./pages/DesignShowcase";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gelir-gider" component={GelirGider} />
      <Route path="/borc-odemeler" component={BorcOdemeler} />
      <Route path="/hedef" component={Hedef} />
      <Route path="/raporlar" component={Raporlar} />
      <Route path="/ayarlar" component={Settings} />
      <Route path="/login" component={Login} />
      <Route path="/dev/design" component={DesignShowcase} />

      {/* Redirects from old Turkish paths */}
      <Route path="/gelirler">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/giderler">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/butce-limitleri">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/borclar">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/taksitler">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/yillik-odemeler">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/odeme-takibi">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/birikim">
        <Redirect to="/hedef" />
      </Route>
      <Route path="/hedef-planlama">
        <Redirect to="/hedef" />
      </Route>
      <Route path="/analitik">
        <Redirect to="/raporlar" />
      </Route>
      <Route path="/ay-arsivi">
        <Redirect to="/raporlar" />
      </Route>
      <Route path="/benim-butcem">
        <Redirect to="/" />
      </Route>
      <Route path="/esimin-butcesi">
        <Redirect to="/" />
      </Route>

      {/* Redirects from English paths */}
      <Route path="/incomes">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/expenses">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/budget-limits">
        <Redirect to="/gelir-gider" />
      </Route>
      <Route path="/debts">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/installments">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/annual">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/payment-tracking">
        <Redirect to="/borc-odemeler" />
      </Route>
      <Route path="/savings">
        <Redirect to="/hedef" />
      </Route>
      <Route path="/goal-planning">
        <Redirect to="/hedef" />
      </Route>
      <Route path="/analytics">
        <Redirect to="/raporlar" />
      </Route>
      <Route path="/month-archive">
        <Redirect to="/raporlar" />
      </Route>
      <Route path="/my-budget">
        <Redirect to="/" />
      </Route>
      <Route path="/spouse-budget">
        <Redirect to="/" />
      </Route>
      <Route path="/settings">
        <Redirect to="/ayarlar" />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MonthRolloverMount() {
  useMonthRollover();
  // One-time cleanup of legacy localStorage keys
  if (typeof window !== "undefined") {
    localStorage.removeItem("viyana_recurring_templates");
  }
  return null;
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const { data: familySession, isLoading } = trpc.familyAuth.me.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (!isLoading && !familySession && location !== "/login") {
      setLocation("/login");
    }
  }, [isLoading, familySession, location, setLocation]);

  useEffect(() => {
    if (!isLoading && familySession && location === "/login") {
      setLocation("/");
    }
  }, [isLoading, familySession, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl animate-bounce">🐼</div>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!familySession) {
    return <Login />;
  }

  return (
    <PersonFilterProvider>
      <MonthRolloverMount />
      <DashboardLayout>
        <Router />
      </DashboardLayout>
    </PersonFilterProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <PersonProvider>
          <BudgetProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </BudgetProvider>
        </PersonProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
