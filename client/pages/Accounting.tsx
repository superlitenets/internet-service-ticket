import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Receipt,
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
} from "lucide-react";

interface AccountingTransaction {
  id: string;
  type: "invoice" | "quote" | "sales" | "expense" | "payment" | "pos";
  title: string;
  description: string;
  amount: number;
  date: string;
  status: "draft" | "pending" | "completed" | "paid" | "cancelled";
  reference?: string;
  notes?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  invoice: FileText,
  quote: Receipt,
  sales: TrendingUp,
  expense: DollarSign,
  payment: CreditCard,
  pos: ShoppingCart,
};

const typeColors: Record<string, string> = {
  invoice: "bg-blue-50",
  quote: "bg-purple-50",
  sales: "bg-green-50",
  expense: "bg-red-50",
  payment: "bg-orange-50",
  pos: "bg-amber-50",
};

export function AccountingPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<AccountingTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [transactions, setTransactions] = useState<AccountingTransaction[]>([
    {
      id: "INV-2024-001",
      type: "invoice",
      title: "Invoice #2024-001",
      description: "ABC Corp - Monthly Service",
      amount: 5000,
      date: "2024-01-15",
      status: "paid",
      reference: "ABC-001",
    },
    {
      id: "QT-2024-001",
      type: "quote",
      title: "Quote #2024-001",
      description: "XYZ Ltd - Network Setup",
      amount: 8500,
      date: "2024-01-14",
      status: "pending",
      reference: "XYZ-QT-001",
    },
    {
      id: "SAL-2024-001",
      type: "sales",
      title: "Sales Transaction",
      description: "Direct Sales - Internet Packages",
      amount: 3200,
      date: "2024-01-13",
      status: "completed",
      reference: "SAL-001",
    },
    {
      id: "EXP-2024-001",
      type: "expense",
      title: "Office Supplies",
      description: "Monthly office supplies purchase",
      amount: 850,
      date: "2024-01-12",
      status: "completed",
    },
    {
      id: "PAY-2024-001",
      type: "payment",
      title: "Payment Received",
      description: "Invoice #2024-001 Payment",
      amount: 5000,
      date: "2024-01-10",
      status: "completed",
      reference: "INV-2024-001",
    },
    {
      id: "POS-2024-001",
      type: "pos",
      title: "POS Transaction",
      description: "Retail Sales",
      amount: 1500,
      date: "2024-01-09",
      status: "completed",
      reference: "POS-001",
    },
  ]);

  const [formData, setFormData] = useState({
    type: "invoice" as const,
    title: "",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    status: "draft" as const,
    reference: "",
    notes: "",
  });

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenDialog = (transaction?: AccountingTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        title: transaction.title,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        status: transaction.status,
        reference: transaction.reference || "",
        notes: transaction.notes || "",
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: "invoice",
        title: "",
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        status: "draft",
        reference: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.description || formData.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === editingTransaction.id
            ? {
                ...tx,
                ...formData,
              }
            : tx,
        ),
      );
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } else {
      const typeInitials: Record<string, string> = {
        invoice: "INV",
        quote: "QT",
        sales: "SAL",
        expense: "EXP",
        payment: "PAY",
        pos: "POS",
      };
      const newId = `${typeInitials[formData.type]}-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, "0")}`;

      const newTransaction: AccountingTransaction = {
        id: newId,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        status: formData.status,
        reference: formData.reference,
        notes: formData.notes,
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    toast({
      title: "Success",
      description: "Transaction deleted successfully",
    });
  };

  const totalRevenue = transactions
    .filter((tx) => ["invoice", "sales", "payment"].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
            <p className="text-muted-foreground mt-1">
              Manage invoices, quotes, sales, expenses, and payments
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus size={16} />
            New Transaction
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </p>
            <p className="text-2xl font-bold mt-2">
              KES {totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </p>
            <p className="text-2xl font-bold mt-2">
              KES {totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-1">+5% from last month</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Net Profit
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              KES {(totalRevenue - totalExpenses).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Items
            </p>
            <p className="text-2xl font-bold mt-2">
              {transactions.filter((tx) => tx.status === "pending").length}
            </p>
            <p className="text-xs text-orange-600 mt-1">Awaiting action</p>
          </Card>
        </div>

        {/* Transactions List */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search by title, description, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="quote">Quotes</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const IconComponent = typeIcons[transaction.type];
                return (
                  <div
                    key={transaction.id}
                    className={`p-4 rounded-lg border border-border ${typeColors[transaction.type]} hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-white rounded-lg">
                            <IconComponent
                              size={18}
                              className="text-foreground"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {transaction.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {transaction.id}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 ml-10">
                          {transaction.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm ml-10">
                          <div className="flex items-center gap-2">
                            <Calendar
                              size={14}
                              className="text-muted-foreground"
                            />
                            {transaction.date}
                          </div>
                          <div className="font-semibold">
                            KES {transaction.amount.toLocaleString()}
                          </div>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(transaction.status)}
                          >
                            {transaction.status}
                          </Badge>
                          {transaction.reference && (
                            <div className="text-muted-foreground">
                              Ref: {transaction.reference}
                            </div>
                          )}
                        </div>
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground mt-2 ml-10">
                            Notes: {transaction.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(transaction)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Transaction Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "Edit Transaction" : "New Transaction"}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? "Update transaction details"
                  : "Create a new accounting transaction"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Transaction Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Invoice #2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., ABC Corp - Monthly Service"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (KES) *
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reference
                </label>
                <Input
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="e.g., ABC-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingTransaction ? "Update" : "Create"} Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
