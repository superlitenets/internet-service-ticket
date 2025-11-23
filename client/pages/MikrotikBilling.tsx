import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, DollarSign, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllInvoices,
  getMikrotikPlans,
  generateInvoice,
  createMikrotikPlan,
} from "@/lib/mikrotik-client";
import { MikrotikInvoice, MikrotikPlan } from "@shared/api";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";

export default function MikrotikBillingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("invoices");
  const [loading, setLoading] = useState(false);

  const [selectedInstance, setSelectedInstance] =
    useState<MikrotikInstance | null>(null);
  const [invoices, setInvoices] = useState<MikrotikInvoice[]>([]);
  const [plans, setPlans] = useState<MikrotikPlan[]>([]);

  useEffect(() => {
    const defaultInstance = getDefaultMikrotikInstance();
    setSelectedInstance(defaultInstance);
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadInvoices();
      loadPlans();
    }
  }, [selectedInstance]);

  const loadInvoices = async () => {
    if (!selectedInstance) return;
    try {
      setLoading(true);
      const data = await getAllInvoices(selectedInstance.id);
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    if (!selectedInstance) return;
    try {
      const data = await getMikrotikPlans(selectedInstance.id);
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const getTotalRevenue = () => {
    return invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getPaidRevenue = () => {
    return invoices
      .filter((inv) => inv.paymentStatus === "paid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getPendingRevenue = () => {
    return invoices
      .filter(
        (inv) =>
          inv.paymentStatus === "pending" || inv.paymentStatus === "overdue",
      )
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Mikrotik Billing
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage invoices, billing plans, and payment processing
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-foreground mt-2">
              KES {getTotalRevenue().toFixed(2)}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              KES {getPaidRevenue().toFixed(2)}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium">Pending</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              KES {getPendingRevenue().toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoices" className="gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="billing-automation" className="gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Invoices ({invoices.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-4 text-left font-medium">
                          Invoice #
                        </th>
                        <th className="py-3 px-4 text-left font-medium">
                          Customer
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          Amount
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Status
                        </th>
                        <th className="py-3 px-4 text-left font-medium">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No invoices found
                          </td>
                        </tr>
                      ) : (
                        invoices.slice(-20).map((invoice) => (
                          <tr
                            key={invoice.id}
                            className="border-b border-border hover:bg-muted/30"
                          >
                            <td className="py-3 px-4 font-medium text-foreground">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="py-3 px-4">
                              {invoice.customerName}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              KES {invoice.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  invoice.paymentStatus === "paid"
                                    ? "default"
                                    : invoice.paymentStatus === "overdue"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {invoice.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Service Plans ({plans.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="p-4 border">
                      <h4 className="font-semibold text-foreground mb-2">
                        {plan.planName}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Price: </span>
                          <span className="font-medium">
                            KES {plan.monthlyFee}
                          </span>
                        </p>
                        {plan.dataQuota && (
                          <p>
                            <span className="text-muted-foreground">
                              Data Quota:
                            </span>
                            <span className="font-medium ml-2">
                              {plan.dataQuota} GB
                            </span>
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Billing Automation Tab */}
          <TabsContent value="billing-automation" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Billing Automation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure automatic billing, invoicing, and payment processing
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Auto-Generate Invoices
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Automatically create invoices on billing dates
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                  <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Auto-Apply Payments
                    </h4>
                    <p className="text-sm text-green-800 mb-3">
                      Automatically apply received payments to invoices
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
