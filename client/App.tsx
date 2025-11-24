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
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Protected routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/tickets"
      element={
        <ProtectedRoute>
          <Tickets />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customers"
      element={
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/team"
      element={
        <ProtectedRoute requiredRole={["admin", "manager"]}>
          <Team />
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory"
      element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      }
    />
    <Route
      path="/employees"
      element={
        <ProtectedRoute>
          <Employees />
        </ProtectedRoute>
      }
    />
    <Route
      path="/attendance"
      element={
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/leave"
      element={
        <ProtectedRoute>
          <Leave />
        </ProtectedRoute>
      }
    />
    <Route
      path="/payroll"
      element={
        <ProtectedRoute requiredRole={["admin", "manager"]}>
          <Payroll />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance"
      element={
        <ProtectedRoute>
          <Performance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/payments"
      element={
        <ProtectedRoute requiredRole={["admin", "support", "manager"]}>
          <Payments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mikrotik/accounts/:accountId"
      element={
        <ProtectedRoute>
          <AccountDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mikrotik/accounts"
      element={
        <ProtectedRoute>
          <MikrotikAccounts />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mikrotik/billing"
      element={
        <ProtectedRoute>
          <MikrotikBilling />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mikrotik/monitoring"
      element={
        <ProtectedRoute>
          <MikrotikMonitoring />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute requiredRole={["admin", "manager"]}>
          <Reports />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute requiredRole={["admin"]}>
          <Settings />
        </ProtectedRoute>
      }
    />
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

export default App;
