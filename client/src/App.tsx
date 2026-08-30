/** Civic Ledger design reminder: authenticated routes present evidence in a role-aware, low-noise app shell. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/dashboard" component={Home} />
    <Route path="/projects/:projectId" component={Home} />
    <Route path="/projects" component={Home} />
    <Route path="/risk" component={Home} />
    <Route path="/early-warnings" component={Home} />
    <Route path="/analytics" component={Home} />
    <Route path="/assistant" component={Home} />
    <Route path="/settings" component={Home} />
    <Route component={Home} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
