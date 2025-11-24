import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tickets from "./pages/Tickets";
import Customers from "./pages/Customers";
import Team from "./pages/Team";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Payments from "./pages/Payments";
import MikrotikAccounts from "./pages/MikrotikAccounts";
import MikrotikBilling from "./pages/MikrotikBilling";
import MikrotikMonitoring from "./pages/MikrotikMonitoring";
import Reports from "./pages/Reports";
import AccountDetail from "./pages/AccountDetail";
import { createRoot } from "react-dom/client";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/tickets" element={<Tickets />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/team" element={<Team />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/employees" element={<Employees />} />
    <Route path="/attendance" element={<Attendance />} />
    <Route path="/leave" element={<Leave />} />
    <Route path="/payroll" element={<Payroll />} />
    <Route path="/performance" element={<Performance />} />
    <Route path="/payments" element={<Payments />} />
    <Route path="/mikrotik/accounts/:accountId" element={<AccountDetail />} />
    <Route path="/mikrotik/accounts" element={<MikrotikAccounts />} />
    <Route path="/mikrotik/billing" element={<MikrotikBilling />} />
    <Route path="/mikrotik/monitoring" element={<MikrotikMonitoring />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/settings" element={<Settings />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

export default App;
