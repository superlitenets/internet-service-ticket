import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Home,
  Package,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Wifi,
  FileText,
  ChevronDown,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path?: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path?: string) => path && location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((g) => g !== groupLabel)
        : [...prev, groupLabel],
    );
  };

  const navItems: NavItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    {
      label: "Tasks",
      icon: CheckSquare,
      subItems: [
        { path: "/tickets", label: "Tickets", icon: BarChart3 },
        { path: "/customers", label: "Customers", icon: Users },
        { path: "/team", label: "Team", icon: Users },
      ],
    },
    { path: "/inventory", label: "Inventory", icon: Package },
    {
      label: "HR",
      icon: Briefcase,
      subItems: [
        { path: "/employees", label: "Employees", icon: Users },
        { path: "/attendance", label: "Attendance", icon: Clock },
        { path: "/leave", label: "Leave", icon: Calendar },
        { path: "/payroll", label: "Payroll", icon: DollarSign },
        { path: "/performance", label: "Performance", icon: TrendingUp },
      ],
    },
    { path: "/payments", label: "Payments", icon: DollarSign },
    {
      label: "Mikrotik ISP",
      icon: Wifi,
      subItems: [
        { path: "/mikrotik/accounts", label: "Accounts", icon: Users },
        { path: "/mikrotik/billing", label: "Billing", icon: DollarSign },
        { path: "/mikrotik/monitoring", label: "Monitoring", icon: TrendingUp },
      ],
    },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-sm">CRM</span>
              </div>
              <span className="font-bold text-lg text-sidebar-foreground hidden sm:inline">
                NetFlow
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              // If item has subItems, render as collapsible group
              if (item.subItems) {
                const isExpanded = expandedGroups.includes(item.label);
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                        isExpanded
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform duration-200",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {/* Submenu */}
                    {isExpanded && (
                      <div className="ml-2 mt-2 space-y-1 pl-2 border-l border-sidebar-border">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path!}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                                isActive(subItem.path)
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <SubIcon size={16} />
                              <span className="font-medium">
                                {subItem.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular flat menu item
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-sidebar-border p-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  John Doe
                </p>
                <p className="text-xs text-sidebar-accent-foreground truncate">
                  Admin
                </p>
              </div>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm font-medium">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-foreground hover:text-primary transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 md:flex-none" />
          <div className="text-sm text-muted-foreground">
            Welcome to NetFlow CRM
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-background">{children}</div>
      </main>
    </div>
  );
}
