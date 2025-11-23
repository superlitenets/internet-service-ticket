import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Printer,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikAccounts,
  getAccountInvoices,
  getAccountPayments,
  getAllInvoices,
} from "@/lib/mikrotik-client";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";
import { MikrotikAccount, MikrotikInvoice, MikrotikPayment } from "@shared/api";

export default function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);

  // Mikrotik Instance State
  const [mikrotikInstances, setMikrotikInstances] = useState<MikrotikInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<MikrotikInstance | null>(null);

  // Data State
  const [accounts, setAccounts] = useState<MikrotikAccount[]>([]);
  const [invoices, setInvoices] = useState<MikrotikInvoice[]>([]);
  const [payments, setPayments] = useState<MikrotikPayment[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const instances = getMikrotikInstances();
        setMikrotikInstances(instances);

        const defaultInstance = getDefaultMikrotikInstance();
        setSelectedInstance(defaultInstance);
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };

    initializeData();
  }, []);

  // Load data when selected instance changes
  useEffect(() => {
    if (selectedInstance) {
      loadData(selectedInstance.id);
    }
  }, [selectedInstance?.id]);

  const loadData = async (instanceId?: string) => {
    try {
      setLoading(true);

      const [accountsData, invoicesData] = await Promise.all([
        getMikrotikAccounts(instanceId),
        getAllInvoices(instanceId),
      ]);

      setAccounts(accountsData);
      setInvoices(invoicesData);

      // Load payments
      const allPayments: MikrotikPayment[] = [];
      for (const account of accountsData) {
        try {
          const accountPayments = await getAccountPayments(account.id, instanceId);
          allPayments.push(...accountPayments);
        } catch (err) {
          console.error(`Failed to load payments for account ${account.id}:`, err);
        }
      }
      setPayments(allPayments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and calculate summary metrics
  const getFilteredData = () => {
    let filteredAccounts = accounts;
    let filteredInvoices = invoices;
    let filteredPayments = payments;

    // Apply account status filter
    if (accountStatusFilter !== "all") {
      filteredAccounts = filteredAccounts.filter((a) => a.status === accountStatusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAccounts = filteredAccounts.filter(
        (a) =>
          a.customerName.toLowerCase().includes(term) ||
          a.customerEmail.toLowerCase().includes(term) ||
          a.customerPhone.includes(term) ||
          a.accountNumber.toLowerCase().includes(term)
      );
    }

    // Apply date filters to invoices and payments
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      filteredInvoices = filteredInvoices.filter((inv) => {
        const invDate = new Date(inv.issueDate);
        if (start && invDate < start) return false;
        if (end && invDate > end) return false;
        return true;
      });

      filteredPayments = filteredPayments.filter((pay) => {
        const payDate = new Date(pay.paymentDate);
        if (start && payDate < start) return false;
        if (end && payDate > end) return false;
        return true;
      });
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      filteredInvoices = filteredInvoices.filter((inv) => inv.status === paymentStatusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== "all") {
      filteredPayments = filteredPayments.filter((pay) => pay.paymentMethod === paymentMethodFilter);
    }

    return { filteredAccounts, filteredInvoices, filteredPayments };
  };

  const { filteredAccounts, filteredInvoices, filteredPayments } = getFilteredData();

  // Calculate summary metrics
  const summaryMetrics = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter((a) => a.status === "active").length,
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: payments.reduce((sum, pay) => sum + pay.amount, 0),
    pendingInvoices: invoices.filter((inv) => inv.status === "issued").length,
    overdueInvoices: invoices.filter((inv) => inv.status === "overdue").length,
    outstandingBalance: accounts.reduce((sum, acc) => sum + acc.outstandingBalance, 0),
  };

  // Calculate aging report data
  const getAgingData = () => {
    const today = new Date();
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90Plus: 0,
    };

    filteredInvoices.forEach((inv) => {
      if (inv.status === "paid") return;

      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue < 0) {
        aging.current += inv.total;
      } else if (daysOverdue < 30) {
        aging.days30 += inv.total;
      } else if (daysOverdue < 60) {
        aging.days60 += inv.total;
      } else {
        aging.days90Plus += inv.total;
      }
    });

    return aging;
  };

  const agingData = getAgingData();

  // Export CSV
  const exportToCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map((row) =>
        Object.values(row)
          .map((val) => {
            const strVal = String(val || "");
            return strVal.includes(",") ? `"${strVal}"` : strVal;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export Customer Report
  const handleExportCustomerReport = () => {
    const data = filteredAccounts.map((account) => ({
      "Account Number": account.accountNumber,
      "Customer Name": account.customerName,
      Email: account.customerEmail,
      Phone: account.customerPhone,
      "Account Type": account.accountType,
      Status: account.status,
      Plan: account.planName,
      "Monthly Fee": account.monthlyFee,
      "Outstanding Balance": account.outstandingBalance,
      "Total Paid": account.totalPaid,
      "Registration Date": account.registrationDate,
    }));
    exportToCSV(data, "customer-report");
    toast({
      title: "Success",
      description: "Customer report exported successfully",
    });
  };

  // Export Payment Report
  const handleExportPaymentReport = () => {
    const data = filteredPayments.map((payment) => ({
      "Payment ID": payment.paymentId,
      "Account Number": payment.accountNumber,
      "Invoice ID": payment.invoiceId || "N/A",
      Amount: payment.amount,
      "Payment Method": payment.paymentMethod,
      "Payment Date": payment.paymentDate,
      Status: payment.status,
      "M-Pesa Receipt": payment.mpesaReceiptNumber || "N/A",
    }));
    exportToCSV(data, "payment-report");
    toast({
      title: "Success",
      description: "Payment report exported successfully",
    });
  };

  // Print functionality
  const handlePrint = (content: string) => {
    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Report</title>");
      printWindow.document.write("<style>");
      printWindow.document.write("body { font-family: Arial; }");
      printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
      printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
      printWindow.document.write("th { background-color: #f2f2f2; }");
      printWindow.document.write("h1 { color: #333; }");
      printWindow.document.write(".metric { display: inline-block; margin: 20px 20px 20px 0; }");
      printWindow.document.write("</style>");
      printWindow.document.write("</head><body>");
      printWindow.document.write(content);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Customer, Payment & Account Reports</p>
        </div>

        {/* Instance Selector */}
        {mikrotikInstances.length > 0 && (
          <div className="w-full md:w-64">
            <Select
              value={selectedInstance?.id || ""}
              onValueChange={(id) => {
                const instance = mikrotikInstances.find((i) => i.id === id);
                setSelectedInstance(instance || null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select instance" />
              </SelectTrigger>
              <SelectContent>
                {mikrotikInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.name}
                    {instance.isDefault && <Badge className="ml-2">Default</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Account Status</label>
              <Select value={accountStatusFilter} onValueChange={setAccountStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.activeAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">KES {(summaryMetrics.totalRevenue / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.pendingInvoices}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Bills</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.overdueInvoices}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Report Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-3xl font-bold text-blue-600">{summaryMetrics.totalAccounts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Accounts</p>
                  <p className="text-3xl font-bold text-green-600">{summaryMetrics.activeAccounts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-blue-600">KES {(summaryMetrics.totalRevenue / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-3xl font-bold text-green-600">KES {(summaryMetrics.totalPaid / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-red-600">KES {(summaryMetrics.outstandingBalance / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {summaryMetrics.totalRevenue > 0
                      ? ((summaryMetrics.totalPaid / summaryMetrics.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleExportCustomerReport}
                disabled={loading || filteredAccounts.length === 0}
                className="gap-2"
              >
                <Download size={16} />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const html = `
                    <h1>Customer Report</h1>
                    <table>
                      <thead>
                        <tr>
                          <th>Account Number</th>
                          <th>Customer Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Plan</th>
                          <th>Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredAccounts
                          .map(
                            (a) => `
                          <tr>
                            <td>${a.accountNumber}</td>
                            <td>${a.customerName}</td>
                            <td>${a.customerEmail}</td>
                            <td>${a.customerPhone}</td>
                            <td>${a.status}</td>
                            <td>${a.planName}</td>
                            <td>KES ${a.outstandingBalance.toLocaleString()}</td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  `;
                  handlePrint(html);
                }}
                disabled={loading || filteredAccounts.length === 0}
                className="gap-2"
              >
                <Printer size={16} />
                Print
              </Button>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Account</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{account.accountNumber}</td>
                        <td className="px-6 py-4 text-sm">{account.customerName}</td>
                        <td className="px-6 py-4 text-sm">{account.customerEmail}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant={account.status === "active" ? "default" : "secondary"}>
                            {account.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">{account.planName}</td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          KES {account.outstandingBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleExportPaymentReport}
                disabled={loading || filteredPayments.length === 0}
                className="gap-2"
              >
                <Download size={16} />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const html = `
                    <h1>Payment History Report</h1>
                    <table>
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Account Number</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Payment Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredPayments
                          .map(
                            (p) => `
                          <tr>
                            <td>${p.paymentId}</td>
                            <td>${p.accountNumber}</td>
                            <td>KES ${p.amount.toLocaleString()}</td>
                            <td>${p.paymentMethod}</td>
                            <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td>${p.status}</td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  `;
                  handlePrint(html);
                }}
                disabled={loading || filteredPayments.length === 0}
                className="gap-2"
              >
                <Printer size={16} />
                Print
              </Button>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Payment ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Account</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Method</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{payment.paymentId}</td>
                        <td className="px-6 py-4 text-sm">{payment.accountNumber}</td>
                        <td className="px-6 py-4 text-sm font-semibold">KES {payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">{payment.paymentMethod}</td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Aging Analysis Tab */}
          <TabsContent value="aging" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 border-0 shadow-sm bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      KES {(agingData.current / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-sm bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">1-30 Days</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-600">
                      KES {(agingData.days30 / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-sm bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">31-60 Days</p>
                    <p className="text-2xl font-bold mt-1 text-orange-600">
                      KES {(agingData.days60 / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-sm bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">90+ Days</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      KES {(agingData.days90Plus / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </Card>
            </div>

            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Overdue Invoices</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Invoice</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Due Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Days Overdue</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvoices
                      .filter((inv) => inv.status !== "paid")
                      .sort(
                        (a, b) =>
                          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                      )
                      .map((invoice) => {
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                            <td className="px-6 py-4 text-sm">{invoice.customerName}</td>
                            <td className="px-6 py-4 text-sm font-semibold">KES {invoice.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">{Math.max(0, daysOverdue)}</td>
                            <td className="px-6 py-4 text-sm">
                              <Badge
                                variant={
                                  daysOverdue > 90
                                    ? "destructive"
                                    : daysOverdue > 60
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {daysOverdue > 0 ? `Overdue ${daysOverdue}d` : "Current"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
