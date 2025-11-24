import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  DollarSign,
  FileText,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  ArrowRight,
} from "lucide-react";

interface AccountingModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count?: number;
}

export function AccountingPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const modules: AccountingModule[] = [
    {
      id: "invoices",
      title: "Invoices",
      description: "Create, manage, and track customer invoices",
      icon: FileText,
      color: "bg-blue-50 hover:bg-blue-100",
      count: 12,
    },
    {
      id: "quotes",
      title: "Quotes",
      description: "Generate and send quotes to customers",
      icon: Receipt,
      color: "bg-purple-50 hover:bg-purple-100",
      count: 5,
    },
    {
      id: "sales",
      title: "Sales",
      description: "Track sales transactions and revenue",
      icon: TrendingUp,
      color: "bg-green-50 hover:bg-green-100",
      count: 24,
    },
    {
      id: "expenses",
      title: "Expenses",
      description: "Record and categorize business expenses",
      icon: DollarSign,
      color: "bg-red-50 hover:bg-red-100",
      count: 8,
    },
    {
      id: "payments",
      title: "Payments",
      description: "Manage incoming and outgoing payments",
      icon: CreditCard,
      color: "bg-orange-50 hover:bg-orange-100",
      count: 31,
    },
    {
      id: "pos",
      title: "POS System",
      description: "Point of sale transactions and inventory",
      icon: ShoppingCart,
      color: "bg-amber-50 hover:bg-amber-100",
      count: 3,
    },
  ];

  const handleModuleClick = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
        <p className="text-muted-foreground mt-2">
          Manage your business finances with integrated accounting modules
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const IconComponent = module.icon;
          const isExpanded = expandedModule === module.id;

          return (
            <Card
              key={module.id}
              className={`cursor-pointer transition-all duration-300 ${module.color}`}
              onClick={() => handleModuleClick(module.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <IconComponent size={24} className="text-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  {module.count !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {module.count}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {module.count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <Button className="w-full justify-between" variant="outline">
                        <span>View {module.title}</span>
                        <ArrowRight size={16} />
                      </Button>
                      <Button className="w-full" variant="default">
                        <span>New {module.title.slice(0, -1)}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 45,280</div>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 8,940</div>
            <p className="text-xs text-red-600 mt-1">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KES 36,340</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-orange-600 mt-1">KES 2,450 awaiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest accounting activities across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Invoice #2024-001 Created</p>
                <p className="text-sm text-muted-foreground">
                  Customer: ABC Corp
                </p>
              </div>
              <p className="text-sm font-medium">KES 5,000</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Expense Recorded</p>
                <p className="text-sm text-muted-foreground">
                  Office Supplies
                </p>
              </div>
              <p className="text-sm font-medium">-KES 850</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-muted-foreground">
                  Invoice #2024-001
                </p>
              </div>
              <p className="text-sm font-medium text-green-600">+KES 5,000</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Quote #2024-Q001 Sent</p>
                <p className="text-sm text-muted-foreground">
                  Potential Customer: XYZ Ltd
                </p>
              </div>
              <p className="text-sm font-medium">KES 8,500</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
