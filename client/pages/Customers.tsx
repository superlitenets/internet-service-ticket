import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCustomers as apiGetCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
  type Customer as ApiCustomer,
} from "@/lib/customers-client";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType?: string;
  status: "active" | "inactive" | "suspended";
  registeredAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    accountType: "residential" as const,
    status: "active" as const,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load customers from API on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const dbCustomers = await apiGetCustomers();
        
        // Convert API customers to UI format
        const uiCustomers = dbCustomers.map((c: ApiCustomer) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          accountType: c.accountType,
          status: c.status as "active" | "inactive" | "suspended",
          registeredAt: new Date(c.registeredAt).toLocaleString(),
          updatedAt: new Date(c.updatedAt).toLocaleString(),
        }));
        
        setCustomers(uiCustomers);
      } catch (error) {
        console.error("Failed to load customers:", error);
        toast({
          title: "Error",
          description: "Failed to load customers from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        accountType: (customer.accountType as "residential" | "business") || "residential",
        status: customer.status,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        accountType: "residential",
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCustomer) {
        // Update existing customer
        await apiUpdateCustomer(editingCustomer.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          accountType: formData.accountType,
          status: formData.status,
          registeredAt: editingCustomer.registeredAt,
          updatedAt: new Date().toISOString(),
        });

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  accountType: formData.accountType,
                  status: formData.status,
                  updatedAt: new Date().toLocaleString(),
                }
              : c,
          ),
        );

        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        // Create new customer
        const newCustomer = await apiCreateCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          accountType: formData.accountType,
        });

        setCustomers((prev) => [
          ...prev,
          {
            id: newCustomer.id,
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            accountType: newCustomer.accountType,
            status: newCustomer.status,
            registeredAt: new Date(newCustomer.registeredAt).toLocaleString(),
            updatedAt: new Date(newCustomer.updatedAt).toLocaleString(),
          },
        ]);

        toast({
          title: "Success",
          description: "Customer added successfully",
        });
      }
    } catch (error) {
      console.error("Save customer error:", error);
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(false);
  };

  const handleDelete = async (customerId: string) => {
    try {
      await apiDeleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Delete customer error:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
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
              Customers
            </h1>
            <p className="text-muted-foreground">
              Manage customer accounts and service plans
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

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by name, email, or phone..."
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
          </div>
        </Card>

        {/* Customers Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading customers from database...</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Account Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-muted-foreground" />
                            {customer.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-muted-foreground" />
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground capitalize">
                          {customer.accountType || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            variant="secondary"
                            className={getStatusColor(customer.status)}
                          >
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground text-xs">
                          {customer.registeredAt}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(customer)}
                              className="gap-1"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteConfirm(customer.id)}
                              className="gap-1"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">No customers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-6 py-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCustomers.length} of {customers.length} customers
              </p>
            </div>
            </>
          )}
        </Card>

        {/* Create/Edit Dialog */}
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Acme Corporation"
                />
              </div>

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
                  Phone *
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Type
                  </label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        accountType: value as "residential" | "business",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
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
                Are you sure you want to delete this customer? This action cannot
                be undone.
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
