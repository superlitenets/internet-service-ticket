import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Network,
  Loader,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikAccounts,
  getMikrotikPlans,
  createMikrotikAccount,
  createMikrotikPlan,
  generateInvoice,
  getAllInvoices,
  recordPayment,
  getMikrotikStats,
  getRouterOSConfig,
  updateRouterOSConfig,
  testRouterOSConnection,
  getRouterOSDeviceInfo,
  getRouterOSInterfaceStats,
  getRouterOSPPPoEConnections,
  startBandwidthMonitoring,
  stopBandwidthMonitoring,
  getBandwidthHistory,
  getPeakUsageTime,
  getAverageBandwidthUsage,
  getAllQuotaAlerts,
  getAccountQuotaAlerts,
  getMonitoringStatus,
} from "@/lib/mikrotik-client";
import {
  MikrotikAccount,
  MikrotikPlan,
  MikrotikInvoice,
} from "@shared/api";

export default function MikrotikPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // State
  const [accounts, setAccounts] = useState<MikrotikAccount[]>([]);
  const [plans, setPlans] = useState<MikrotikPlan[]>([]);
  const [invoices, setInvoices] = useState<MikrotikInvoice[]>([]);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingPayments: 0,
    overdueBills: 0,
  });

  // Dialogs
  const [newAccountDialog, setNewAccountDialog] = useState(false);
  const [newPlanDialog, setNewPlanDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<MikrotikInvoice | null>(
    null
  );

  // Forms
  const [accountForm, setAccountForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    accountType: "residential" as const,
    planId: "",
  });

  const [planForm, setPlanForm] = useState({
    planName: "",
    planType: "flat-rate" as const,
    monthlyFee: 0,
    description: "",
    setupFee: 0,
    activationFee: 0,
    features: [] as string[],
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "mpesa" as const,
    mpesaReceiptNumber: "",
  });

  // RouterOS Configuration
  const [routerOSDialog, setRouterOSDialog] = useState(false);
  const [routerOSConfig, setRouterOSConfig] = useState({
    apiUrl: "",
    username: "",
    password: "",
    port: 8728,
    useSsl: false,
  });
  const [routerOSConfigForm, setRouterOSConfigForm] = useState({
    apiUrl: "",
    username: "",
    password: "",
    port: 8728,
    useSsl: false,
  });
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [interfaceStats, setInterfaceStats] = useState<any[]>([]);
  const [pppoeConnections, setPPPoEConnections] = useState<any[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
    loadRouterOSConfig();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, plansData, statsData] = await Promise.all([
        getMikrotikAccounts(),
        getMikrotikPlans(),
        getMikrotikStats(),
      ]);

      setAccounts(accountsData);
      setPlans(plansData);
      setStats(statsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      if (
        !accountForm.customerName ||
        !accountForm.customerEmail ||
        !accountForm.customerPhone ||
        !accountForm.planId
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      const newAccount = await createMikrotikAccount(accountForm);

      setAccounts((prev) => [...prev, newAccount]);
      toast({
        title: "Success",
        description: "Account created successfully",
      });

      setNewAccountDialog(false);
      setAccountForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        accountType: "residential",
        planId: "",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      if (!planForm.planName || !planForm.monthlyFee) {
        toast({
          title: "Error",
          description: "Please fill required fields",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      const newPlan = await createMikrotikPlan(planForm);

      setPlans((prev) => [...prev, newPlan]);
      toast({
        title: "Success",
        description: "Plan created successfully",
      });

      setNewPlanDialog(false);
      setPlanForm({
        planName: "",
        planType: "flat-rate",
        monthlyFee: 0,
        description: "",
        setupFee: 0,
        activationFee: 0,
        features: [],
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (accountId: string) => {
    try {
      setLoading(true);
      await generateInvoice({ accountId });
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (!selectedInvoice || !paymentForm.amount) {
        toast({
          title: "Error",
          description: "Please enter payment amount",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      await recordPayment({
        accountId: selectedInvoice.accountId,
        invoiceId: selectedInvoice.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        mpesaReceiptNumber: paymentForm.mpesaReceiptNumber || undefined,
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      setPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentForm({
        amount: 0,
        paymentMethod: "mpesa",
        mpesaReceiptNumber: "",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRouterOSConfig = async () => {
    try {
      const config = await getRouterOSConfig();
      setRouterOSConfig(config);
      setRouterOSConfigForm(config);
    } catch (error) {
      console.error("Failed to load RouterOS config:", error);
    }
  };

  const handleTestConnection = async () => {
    try {
      if (
        !routerOSConfigForm.apiUrl ||
        !routerOSConfigForm.username ||
        !routerOSConfigForm.password
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      setTestingConnection(true);
      const result = await testRouterOSConnection(routerOSConfigForm);

      if (result.success) {
        setDeviceInfo(result.deviceInfo);
        toast({
          title: "Success",
          description: result.message,
        });

        // Save configuration
        await updateRouterOSConfig(routerOSConfigForm);
        setRouterOSConfig(routerOSConfigForm);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLoadDeviceInfo = async () => {
    try {
      setLoading(true);
      const result = await getRouterOSDeviceInfo();
      if (result.success) {
        setDeviceInfo(result.deviceInfo);
        toast({
          title: "Success",
          description: "Device information loaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load device info",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInterfaceStats = async () => {
    try {
      setLoading(true);
      const result = await getRouterOSInterfaceStats();
      if (result.success) {
        setInterfaceStats(result.interfaces);
        toast({
          title: "Success",
          description: "Interface statistics loaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPPPoEConnections = async () => {
    try {
      setLoading(true);
      const result = await getRouterOSPPPoEConnections();
      if (result.success) {
        setPPPoEConnections(result.connections);
        toast({
          title: "Success",
          description: "PPPoE connections loaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.includes(searchTerm)
  );

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.includes(searchTerm) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Mikrotik ISP Billing
          </h1>
          <p className="text-muted-foreground">
            Manage ISP accounts, billing plans, invoices, and payments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <Users size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {stats.totalAccounts}
              </p>
              <p className="text-xs text-green-600">
                {stats.activeAccounts} active
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <DollarSign size={20} className="text-green-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                KES {(stats.totalRevenue / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground">
                Paid: KES {(stats.paidRevenue / 1000).toFixed(1)}K
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Pending Bills</p>
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {stats.pendingPayments}
              </p>
              <p className="text-xs text-red-600">
                {stats.overdueBills} overdue
              </p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="routeros" className="gap-2">
              <Network size={16} />
              <span className="hidden sm:inline">RouterOS</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  System Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">
                      Total Accounts
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {stats.totalAccounts}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-2">
                      {stats.activeAccounts}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">
                      Revenue (KES)
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-2">
                      {(stats.totalRevenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      placeholder="Search by name or account number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={() => setNewAccountDialog(true)}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    New Account
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Account
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Plan
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No accounts found
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map((account) => (
                          <tr
                            key={account.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-foreground whitespace-nowrap">
                                {account.accountNumber}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">
                                  {account.customerName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {account.customerPhone}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {account.planName}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="capitalize">
                                {account.accountType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  account.status === "active"
                                    ? "default"
                                    : "destructive"
                                }
                                className="gap-1.5"
                              >
                                {account.status === "active" ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <AlertCircle size={14} />
                                )}
                                {account.status.charAt(0).toUpperCase() +
                                  account.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-foreground">
                              KES {account.balance.toLocaleString()}
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

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Invoice
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Period
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Due Date
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No invoices found
                          </td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr
                            key={invoice.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-foreground whitespace-nowrap">
                                {invoice.invoiceNumber}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-foreground">
                                {invoice.customerName}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {invoice.billingPeriod}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-foreground">
                              KES {invoice.total.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  invoice.status === "paid"
                                    ? "default"
                                    : invoice.status === "overdue"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="gap-1.5"
                              >
                                {invoice.status === "paid" ? (
                                  <CheckCircle2 size={14} />
                                ) : invoice.status === "overdue" ? (
                                  <AlertCircle size={14} />
                                ) : (
                                  <Clock size={14} />
                                )}
                                {invoice.status.charAt(0).toUpperCase() +
                                  invoice.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {invoice.status !== "paid" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentDialog(true);
                                  }}
                                  className="gap-1"
                                >
                                  Pay
                                </Button>
                              )}
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Billing Plans
                  </h3>
                  <Button
                    onClick={() => setNewPlanDialog(true)}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    New Plan
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {plan.planName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border">
                          <p className="text-2xl font-bold text-foreground">
                            KES {plan.monthlyFee.toLocaleString()}
                            <span className="text-xs text-muted-foreground ml-2">
                              /month
                            </span>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {plan.planType.replace("-", " ")}
                          </Badge>
                          {plan.dataQuota && (
                            <p className="text-xs text-muted-foreground">
                              {plan.dataQuota}GB quota
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* RouterOS Settings Tab */}
          <TabsContent value="routeros" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">
                  RouterOS Configuration
                </h3>

                {/* Connection Configuration */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-foreground">
                    RouterOS Connection Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        API URL
                      </label>
                      <Input
                        value={routerOSConfigForm.apiUrl}
                        onChange={(e) =>
                          setRouterOSConfigForm({
                            ...routerOSConfigForm,
                            apiUrl: e.target.value,
                          })
                        }
                        placeholder="192.168.1.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Username
                      </label>
                      <Input
                        value={routerOSConfigForm.username}
                        onChange={(e) =>
                          setRouterOSConfigForm({
                            ...routerOSConfigForm,
                            username: e.target.value,
                          })
                        }
                        placeholder="admin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Password
                      </label>
                      <Input
                        type="password"
                        value={routerOSConfigForm.password}
                        onChange={(e) =>
                          setRouterOSConfigForm({
                            ...routerOSConfigForm,
                            password: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Port
                      </label>
                      <Input
                        type="number"
                        value={routerOSConfigForm.port}
                        onChange={(e) =>
                          setRouterOSConfigForm({
                            ...routerOSConfigForm,
                            port: parseInt(e.target.value),
                          })
                        }
                        placeholder="8728"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={routerOSConfigForm.useSsl}
                        onChange={(e) =>
                          setRouterOSConfigForm({
                            ...routerOSConfigForm,
                            useSsl: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-foreground">
                        Use SSL/TLS
                      </span>
                    </label>
                  </div>

                  <Button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="gap-2"
                  >
                    {testingConnection ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Network size={16} />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {/* Device Information */}
                {deviceInfo && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">
                        Device Information
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadDeviceInfo}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          System Identity
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.systemIdentity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Firmware Version
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.firmwareVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Board Name</p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.boardName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CPU Count</p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.cpuCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.uptime}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CPU Load</p>
                        <p className="text-sm font-medium text-foreground">
                          {deviceInfo.cpuLoad}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interface Statistics */}
                {interfaceStats.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">
                        Interface Statistics
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadInterfaceStats}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="py-2 px-4 text-left font-medium">
                              Interface
                            </th>
                            <th className="py-2 px-4 text-left font-medium">
                              Status
                            </th>
                            <th className="py-2 px-4 text-right font-medium">
                              RX (MB)
                            </th>
                            <th className="py-2 px-4 text-right font-medium">
                              TX (MB)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {interfaceStats.map((iface: any) => (
                            <tr key={iface.interfaceName} className="border-b border-border">
                              <td className="py-3 px-4 text-sm font-medium">
                                {iface.interfaceName}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    iface.running ? "default" : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {iface.running ? "Running" : "Down"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right text-sm">
                                {(iface.bytes_in / 1024 / 1024).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right text-sm">
                                {(iface.bytes_out / 1024 / 1024).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PPPoE Connections */}
                {pppoeConnections.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">
                        Active PPPoE Connections
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadPPPoEConnections}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {pppoeConnections.map((conn: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {conn.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uptime: {conn.uptime}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">
                                {(conn.downloadCurrent / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Load Data Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadDeviceInfo}
                    disabled={loading || !routerOSConfig.apiUrl}
                    className="gap-2"
                  >
                    <Network size={16} />
                    Load Device Info
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLoadInterfaceStats}
                    disabled={loading || !routerOSConfig.apiUrl}
                    className="gap-2"
                  >
                    <Network size={16} />
                    Load Interface Stats
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLoadPPPoEConnections}
                    disabled={loading || !routerOSConfig.apiUrl}
                    className="gap-2"
                  >
                    <Users size={16} />
                    Load PPPoE Users
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Account Dialog */}
      <Dialog open={newAccountDialog} onOpenChange={setNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New ISP Account</DialogTitle>
            <DialogDescription>
              Add a new customer ISP account to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Customer Name
              </label>
              <Input
                value={accountForm.customerName}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    customerName: e.target.value,
                  })
                }
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={accountForm.customerEmail}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    customerEmail: e.target.value,
                  })
                }
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={accountForm.customerPhone}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    customerPhone: e.target.value,
                  })
                }
                placeholder="+254722000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Account Type
              </label>
              <Select
                value={accountForm.accountType}
                onValueChange={(value) =>
                  setAccountForm({
                    ...accountForm,
                    accountType: value as any,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="postpaid">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Plan
              </label>
              <Select
                value={accountForm.planId}
                onValueChange={(value) =>
                  setAccountForm({ ...accountForm, planId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.planName} - KES {plan.monthlyFee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewAccountDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Plan Dialog */}
      <Dialog open={newPlanDialog} onOpenChange={setNewPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Add a new billing plan to your system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Plan Name
              </label>
              <Input
                value={planForm.planName}
                onChange={(e) =>
                  setPlanForm({ ...planForm, planName: e.target.value })
                }
                placeholder="Basic Residential"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Plan Type
              </label>
              <Select
                value={planForm.planType}
                onValueChange={(value) =>
                  setPlanForm({ ...planForm, planType: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat-rate">Flat Rate</SelectItem>
                  <SelectItem value="quota-based">Quota Based</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Monthly Fee (KES)
              </label>
              <Input
                type="number"
                value={planForm.monthlyFee}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    monthlyFee: parseFloat(e.target.value),
                  })
                }
                placeholder="1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Input
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
                placeholder="Perfect for home users"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewPlanDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={loading}>
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice &&
                `Payment for invoice ${selectedInvoice.invoiceNumber}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Invoice Amount:
                  </span>
                  <span className="font-semibold text-foreground">
                    KES {selectedInvoice.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Amount (KES)
                </label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Method
                </label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentForm.paymentMethod === "mpesa" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    M-Pesa Receipt Number
                  </label>
                  <Input
                    value={paymentForm.mpesaReceiptNumber}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        mpesaReceiptNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., RVFT1234567"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={loading}>
              {loading ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
