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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  CreditCard,
  Wifi,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikAccounts,
  getMikrotikPlans,
  createMikrotikAccount,
  generateInvoice,
  getAccountInvoices,
  recordPayment,
  getMikrotikStats,
} from "@/lib/mikrotik-client";
import { MikrotikAccount, MikrotikInvoice, MikrotikPlan } from "@shared/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  plan: "basic" | "professional" | "enterprise";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  ticketCount: number;
  mikrotikAccountId?: string;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Mikrotik states
  const [mikrotikAccounts, setMikrotikAccounts] = useState<MikrotikAccount[]>([]);
  const [mikrotikPlans, setMikrotikPlans] = useState<MikrotikPlan[]>([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    plan: "professional" as const,
    status: "active" as const,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "mpesa" as const,
    mpesaReceiptNumber: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "cust_001",
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: "+1 (555) 123-4567",
      company: "Acme Corporation",
      address: "123 Business Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
      plan: "enterprise",
      status: "active",
      createdAt: "2024-01-01",
      ticketCount: 8,
    },
    {
      id: "cust_002",
      name: "Tech Startup Inc",
      email: "support@techstartup.com",
      phone: "+1 (555) 234-5678",
      company: "Tech Startup Inc",
      address: "456 Innovation St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      plan: "professional",
      status: "active",
      createdAt: "2024-01-05",
      ticketCount: 3,
    },
    {
      id: "cust_003",
      name: "Global Industries",
      email: "info@global-ind.com",
      phone: "+1 (555) 345-6789",
      company: "Global Industries Ltd",
      address: "789 Enterprise Blvd",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
      plan: "basic",
      status: "active",
      createdAt: "2024-01-08",
      ticketCount: 2,
    },
  ]);

  // Load Mikrotik data on mount
  useEffect(() => {
    loadMikrotikData();
  }, []);

  const loadMikrotikData = async () => {
    try {
      setLoading(true);
      const [accounts, plans] = await Promise.all([
        getMikrotikAccounts(),
        getMikrotikPlans(),
      ]);

      setMikrotikAccounts(accounts);
      setMikrotikPlans(plans);
    } catch (error) {
      console.error("Failed to load Mikrotik data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    const matchesPlan = planFilter === "all" || customer.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        plan: customer.plan,
        status: customer.status,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        plan: "professional",
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...formData } : c,
        ),
      );
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } else {
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
        ticketCount: 0,
      };
      setCustomers((prev) => [...prev, newCustomer]);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setDeleteConfirm(null);
    toast({
      title: "Success",
      description: "Customer deleted successfully",
    });
  };

  const handleCreateMikrotikAccount = async (customer: Customer) => {
    try {
      setLoading(true);
      if (!mikrotikPlans.length) {
        toast({
          title: "Error",
          description: "No billing plans available. Create a plan first.",
          variant: "destructive",
        });
        return;
      }

      const newAccount = await createMikrotikAccount({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        accountType: "residential",
        planId: mikrotikPlans[0].id,
      });

      setMikrotikAccounts((prev) => [...prev, newAccount]);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, mikrotikAccountId: newAccount.id }
            : c,
        ),
      );

      toast({
        title: "Success",
        description: "Mikrotik account created and linked",
      });
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

  const handleGenerateInvoice = async (mikrotikAccountId: string) => {
    try {
      setLoading(true);
      await generateInvoice({ accountId: mikrotikAccountId });
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      loadMikrotikData();
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

  const getMikrotikAccount = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer?.mikrotikAccountId) return null;
    return mikrotikAccounts.find((a) => a.id === customer.mikrotikAccountId);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-primary/10 text-primary";
      case "professional":
        return "bg-secondary/10 text-secondary";
      case "basic":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/10 text-accent";
      case "inactive":
        return "bg-muted/10 text-muted-foreground";
      case "suspended":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Customers & ISP Billing
            </h1>
            <p className="text-muted-foreground">
              Manage customer accounts and Mikrotik ISP billing plans
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              Customers
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Wifi size={16} />
              Mikrotik Billing
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search by name, email, or company..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Customers Table */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Company
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        City/State
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Plan
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Tickets
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        ISP
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No customers found
                        </td>
                      </tr>
                    ) : null}
                    {filteredCustomers.map((customer) => {
                      const mikrotikAccount = getMikrotikAccount(customer.id);
                      const isExpanded = expandedCustomer === customer.id;

                      return (
                        <tbody key={customer.id}>
                          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                              {customer.name}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {customer.company}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {customer.email}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {customer.phone}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {customer.city}, {customer.state}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={getPlanColor(customer.plan)}
                                variant="secondary"
                              >
                                {customer.plan
                                  .charAt(0)
                                  .toUpperCase() + customer.plan.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={getStatusColor(customer.status)}
                                variant="secondary"
                              >
                                {customer.status
                                  .charAt(0)
                                  .toUpperCase() + customer.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-foreground">
                              {customer.ticketCount}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() =>
                                  setExpandedCustomer(
                                    isExpanded ? null : customer.id,
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                                title="Toggle ISP billing details"
                              >
                                <Wifi size={14} className="text-blue-600" />
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(customer)}
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirm(customer.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-b border-border bg-blue-50">
                              <td colSpan={10} className="py-4 px-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Wifi size={16} className="text-blue-600" />
                                    <h4 className="font-semibold text-foreground">
                                      ISP Billing Details
                                    </h4>
                                  </div>

                                  {mikrotikAccount ? (
                                    <>
                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="bg-white rounded-lg p-3 border border-border">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Account Number
                                          </p>
                                          <p className="font-mono font-semibold text-foreground text-sm">
                                            {mikrotikAccount.accountNumber}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-border">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Plan
                                          </p>
                                          <p className="font-semibold text-foreground text-sm">
                                            {mikrotikAccount.planName}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-border">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Balance
                                          </p>
                                          <p className="font-semibold text-green-600 text-sm">
                                            KES{" "}
                                            {mikrotikAccount.balance.toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-border">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Outstanding
                                          </p>
                                          <p className="font-semibold text-red-600 text-sm">
                                            KES{" "}
                                            {mikrotikAccount.outstandingBalance.toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-border">
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Status
                                          </p>
                                          <Badge
                                            className="capitalize"
                                            variant={
                                              mikrotikAccount.status === "active"
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {mikrotikAccount.status}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div className="flex gap-2 mt-3">
                                        <Button
                                          size="sm"
                                          className="gap-2"
                                          onClick={() =>
                                            handleGenerateInvoice(
                                              mikrotikAccount.id,
                                            )
                                          }
                                          disabled={loading}
                                        >
                                          <FileText size={14} />
                                          Generate Invoice
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-2"
                                        >
                                          <CreditCard size={14} />
                                          Record Payment
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="gap-2"
                                      onClick={() =>
                                        handleCreateMikrotikAccount(customer)
                                      }
                                      disabled={loading}
                                    >
                                      <Plus size={14} />
                                      Create ISP Account
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Mikrotik Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    ISP Billing Accounts
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Overview of all Mikrotik billing accounts
                  </p>
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
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Balance
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mikrotikAccounts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No ISP billing accounts
                          </td>
                        </tr>
                      ) : (
                        mikrotikAccounts.map((account) => (
                          <tr
                            key={account.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-mono text-xs text-foreground whitespace-nowrap">
                                {account.accountNumber}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {account.customerName}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {account.planName}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  account.status === "active"
                                    ? "default"
                                    : "destructive"
                                }
                                className="capitalize"
                              >
                                {account.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600">
                              KES {account.balance.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-red-600">
                              KES {account.outstandingBalance.toLocaleString()}
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
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Update customer information"
                  : "Create a new customer account"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Customer Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company *
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Zip Code
                  </label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    placeholder="94105"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country
                  </label>
                  <Input
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="USA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Service Plan
                  </label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        plan: value as "basic" | "professional" | "enterprise",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as "active" | "inactive" | "suspended",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCustomer ? "Update" : "Create"} Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
