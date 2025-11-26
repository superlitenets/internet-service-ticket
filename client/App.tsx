import "./global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tickets from "./pages/Tickets";
import TicketDetailPage from "./pages/TicketDetailPage";
import Leads from "./pages/Leads";
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
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import LandingContentEditor from "./pages/LandingContentEditor";
import { AccountingPage } from "./pages/Accounting";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />

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
      path="/tickets/:ticketId"
      element={
        <ProtectedRoute>
          <TicketDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/leads"
      element={
        <ProtectedRoute>
          <Leads />
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
    <Route
      path="/users"
      element={
        <ProtectedRoute requiredRole={["admin"]}>
          <UserManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/landing-content"
      element={
        <ProtectedRoute requiredRole={["admin"]}>
          <LandingContentEditor />
        </ProtectedRoute>
      }
    />
    <Route
      path="/accounting"
      element={
        <ProtectedRoute requiredRole={["admin", "manager"]}>
          <AccountingPage />
        </ProtectedRoute>
      }
    />
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
