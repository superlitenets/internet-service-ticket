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
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Trash2,
  Edit,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getPayments as apiGetPayments,
  createPayment as apiCreatePayment,
  updatePayment as apiUpdatePayment,
  deletePayment as apiDeletePayment,
  type Payment as ApiPayment,
} from "@/lib/payments-client";
import {
  initiateMpesaC2B,
  initiateMpesaStkPush,
  getMpesaTransactions,
} from "@/lib/mpesa-client";
import { isMpesaConfigured } from "@/lib/mpesa-settings-storage";
import { MpesaTransaction } from "@shared/api";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: "mpesa" | "bank-transfer" | "cash" | "check";
  status: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  transactionId?: string;
  customerId?: string;
  invoiceId?: string;
  paymentDate: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "cash" as const,
    status: "completed" as const,
    customerId: "",
    invoiceId: "",
    mpesaReceiptNumber: "",
  });

  const [stkForm, setStkForm] = useState({
    phoneNumber: "",
    amount: "",
    accountReference: "",
  });

  const [payments, setPayments] = useState<Payment[]>([]);

  // Load payments from API on mount
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const dbPayments = await apiGetPayments();
        
        const uiPayments = dbPayments.map((p: ApiPayment) => ({
          id: p.id,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          status: p.status,
          mpesaReceiptNumber: p.mpesaReceiptNumber,
          transactionId: p.transactionId,
          customerId: p.customerId,
          invoiceId: p.invoiceId,
          paymentDate: new Date(p.paymentDate).toLocaleString(),
          createdAt: new Date(p.createdAt).toLocaleString(),
        }));
        
        setPayments(uiPayments);
        setIsConfigured(isMpesaConfigured());
        
        // Load MPESA transactions
        if (isConfigured) {
          const mpesaData = await getMpesaTransactions();
          setMpesaTransactions(mpesaData);
        }
      } catch (error) {
        console.error("Failed to load payments:", error);
        toast({
          title: "Error",
          description: "Failed to load payments from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.mpesaReceiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        amount: payment.amount.toString(),
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        customerId: payment.customerId || "",
        invoiceId: payment.invoiceId || "",
        mpesaReceiptNumber: payment.mpesaReceiptNumber || "",
      });
    } else {
      setEditingPayment(null);
      setFormData({
        amount: "",
        paymentMethod: "cash",
        status: "completed",
        customerId: "",
        invoiceId: "",
        mpesaReceiptNumber: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPayment) {
        await apiUpdatePayment(editingPayment.id, {
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          status: formData.status,
        });

        setPayments((prev) =>
          prev.map((p) =>
            p.id === editingPayment.id
              ? {
                  ...p,
                  amount: parseFloat(formData.amount),
                  paymentMethod: formData.paymentMethod,
                  status: formData.status,
                  createdAt: new Date().toLocaleString(),
                }
              : p,
          ),
        );

        toast({
          title: "Success",
          description: "Payment updated successfully",
        });
      } else {
        const newPayment = await apiCreatePayment({
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          status: formData.status,
          customerId: formData.customerId || undefined,
          invoiceId: formData.invoiceId || undefined,
          mpesaReceiptNumber: formData.mpesaReceiptNumber || undefined,
          accountId: "temp-account",
        });

        setPayments((prev) => [
          ...prev,
          {
            id: newPayment.id,
            amount: newPayment.amount,
            paymentMethod: newPayment.paymentMethod,
            status: newPayment.status,
            mpesaReceiptNumber: newPayment.mpesaReceiptNumber,
            transactionId: newPayment.transactionId,
            customerId: newPayment.customerId,
            invoiceId: newPayment.invoiceId,
            paymentDate: new Date(newPayment.paymentDate).toLocaleString(),
            createdAt: new Date(newPayment.createdAt).toLocaleString(),
          },
        ]);

        toast({
          title: "Success",
          description: "Payment recorded successfully",
        });
      }
    } catch (error) {
      console.error("Save payment error:", error);
      toast({
        title: "Error",
        description: "Failed to save payment",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(false);
  };

  const handleDelete = async (paymentId: string) => {
    try {
      await apiDeletePayment(paymentId);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    } catch (error) {
      console.error("Delete payment error:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  const handleInitiateSTK = async () => {
    if (!stkForm.phoneNumber || !stkForm.amount || !stkForm.accountReference) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await initiateMpesaStkPush({
        phoneNumber: stkForm.phoneNumber,
        amount: parseFloat(stkForm.amount),
        accountReference: stkForm.accountReference,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "STK prompt sent successfully",
        });
        setStkForm({
          phoneNumber: "",
          amount: "",
          accountReference: "",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate STK push",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-accent/10 text-accent";
      case "pending":
        return "bg-primary/10 text-primary";
      case "failed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "failed":
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Payments
            </h1>
            <p className="text-muted-foreground">
              Manage payments and transactions
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus size={18} />
            Record Payment
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="mpesa">MPESA</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
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
                      placeholder="Search by ID or reference..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Payments Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">Loading payments...</p>
                </div>
              ) : (
                <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                              {payment.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                {payment.amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground capitalize">
                              {payment.paymentMethod.replace("-", " ")}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Badge
                                variant="secondary"
                                className={getStatusColor(payment.status)}
                              >
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(payment.status)}
                                  {payment.status.charAt(0).toUpperCase() +
                                    payment.status.slice(1)}
                                </span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground text-xs">
                              {payment.paymentDate}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(payment)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(payment.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <p className="text-muted-foreground">No payments found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border px-6 py-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredPayments.length} of {payments.length} payments
                  </p>
                </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* MPESA Tab */}
          <TabsContent value="mpesa" className="space-y-6">
            {!isConfigured ? (
              <Card className="p-6 border-0 shadow-sm bg-destructive/10">
                <p className="text-destructive">
                  MPESA is not configured. Please configure MPESA settings in Settings page.
                </p>
              </Card>
            ) : (
              <>
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Initiate STK Push
                  </h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="Phone number (254...)"
                      value={stkForm.phoneNumber}
                      onChange={(e) =>
                        setStkForm({ ...stkForm, phoneNumber: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={stkForm.amount}
                      onChange={(e) =>
                        setStkForm({ ...stkForm, amount: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Account reference"
                      value={stkForm.accountReference}
                      onChange={(e) =>
                        setStkForm({
                          ...stkForm,
                          accountReference: e.target.value,
                        })
                      }
                    />
                    <Button onClick={handleInitiateSTK} className="w-full">
                      Initiate Payment
                    </Button>
                  </div>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Receipt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mpesaTransactions.length > 0 ? (
                          mpesaTransactions.map((tx) => (
                            <tr
                              key={tx.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-foreground">
                                {tx.amount}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <Badge variant="secondary">{tx.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                {tx.receiptNumber || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground text-xs">
                                {new Date(tx.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                              <p className="text-muted-foreground">
                                No MPESA transactions found
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Edit Payment" : "Record Payment"}
              </DialogTitle>
              <DialogDescription>
                {editingPayment
                  ? "Update payment information"
                  : "Add a new payment record"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Amount *"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />

              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    paymentMethod: value as "mpesa" | "bank-transfer" | "cash" | "check",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">MPESA</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "pending" | "completed" | "failed",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Customer ID (optional)"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
              />

              <Input
                placeholder="MPESA Receipt (optional)"
                value={formData.mpesaReceiptNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mpesaReceiptNumber: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingPayment ? "Update" : "Record"} Payment
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
              <DialogTitle>Delete Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment? This action cannot
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
