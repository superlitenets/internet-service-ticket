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
  Plus,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Building2,
  Phone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  initiateMpesaC2B,
  initiateMpesaB2B,
  initiateMpesaStkPush,
  getMpesaTransactions,
} from "@/lib/mpesa-client";
import { isMpesaConfigured } from "@/lib/mpesa-settings-storage";
import { MpesaTransaction } from "@shared/api";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"c2b" | "b2b" | "stk">("stk");
  const [isConfigured, setIsConfigured] = useState(false);

  const [c2bForm, setC2bForm] = useState({
    phoneNumber: "",
    amount: "",
    accountReference: "",
    transactionDescription: "",
  });

  const [b2bForm, setB2bForm] = useState({
    receiverShortCode: "",
    amount: "",
    commandId: "BusinessPayBill",
    accountReference: "",
    transactionDescription: "",
  });

  const [stkForm, setStkForm] = useState({
    phoneNumber: "",
    amount: "",
    accountReference: "",
    transactionDescription: "",
  });

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
    setIsConfigured(isMpesaConfigured());
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getMpesaTransactions();
      setTransactions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateC2B = async () => {
    try {
      if (
        !c2bForm.phoneNumber ||
        !c2bForm.amount ||
        !c2bForm.accountReference ||
        !c2bForm.transactionDescription
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const result = await initiateMpesaC2B({
        phoneNumber: c2bForm.phoneNumber,
        amount: parseFloat(c2bForm.amount),
        accountReference: c2bForm.accountReference,
        transactionDescription: c2bForm.transactionDescription,
      });

      toast({
        title: "Success",
        description: result.message,
      });

      // Reset form
      setC2bForm({
        phoneNumber: "",
        amount: "",
        accountReference: "",
        transactionDescription: "",
      });

      setDialogOpen(false);
      loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate C2B payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateB2B = async () => {
    try {
      if (
        !b2bForm.receiverShortCode ||
        !b2bForm.amount ||
        !b2bForm.commandId ||
        !b2bForm.accountReference ||
        !b2bForm.transactionDescription
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const result = await initiateMpesaB2B({
        receiverShortCode: b2bForm.receiverShortCode,
        amount: parseFloat(b2bForm.amount),
        commandId: b2bForm.commandId,
        accountReference: b2bForm.accountReference,
        transactionDescription: b2bForm.transactionDescription,
      });

      toast({
        title: "Success",
        description: result.message,
      });

      // Reset form
      setB2bForm({
        receiverShortCode: "",
        amount: "",
        commandId: "BusinessPayBill",
        accountReference: "",
        transactionDescription: "",
      });

      setDialogOpen(false);
      loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate B2B payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSTKPush = async () => {
    try {
      if (
        !stkForm.phoneNumber ||
        !stkForm.amount ||
        !stkForm.accountReference ||
        !stkForm.transactionDescription
      ) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const result = await initiateMpesaStkPush({
        phoneNumber: stkForm.phoneNumber,
        amount: parseFloat(stkForm.amount),
        accountReference: stkForm.accountReference,
        transactionDescription: stkForm.transactionDescription,
      });

      toast({
        title: "Success",
        description: result.message,
      });

      // Reset form
      setStkForm({
        phoneNumber: "",
        amount: "",
        accountReference: "",
        transactionDescription: "",
      });

      setDialogOpen(false);
      loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate STK push",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.accountReference
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    txn.phoneNumber.includes(searchTerm)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} />;
      case "failed":
        return <AlertCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Payments
          </h1>
          <p className="text-muted-foreground">
            Manage MPESA payments, transactions, and payment history
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {transactions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                All time transactions
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {transactions.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600">
                {transactions.filter((t) => t.status === "pending").length}
              </p>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">
                {transactions.filter((t) => t.status === "failed").length}
              </p>
              <p className="text-xs text-muted-foreground">
                Transaction errors
              </p>
            </div>
          </Card>
        </div>

        {!isConfigured && (
          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  MPESA Not Configured
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Please configure MPESA settings in Settings page to start processing payments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="gap-2">
              <DollarSign size={16} />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="initiate" className="gap-2">
              <Plus size={16} />
              <span className="hidden sm:inline">New Payment</span>
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      placeholder="Search by reference or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={loadTransactions}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Phone/Reference
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Receipt
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((txn) => (
                          <tr
                            key={txn.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <Badge variant="outline">{txn.type}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <p className="font-medium text-foreground whitespace-nowrap">
                                  {txn.accountReference}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {txn.phoneNumber}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-foreground">
                              KES {txn.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={getStatusColor(txn.status)}
                                className="gap-1.5"
                              >
                                {getStatusIcon(txn.status)}
                                {txn.status.charAt(0).toUpperCase() +
                                  txn.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {txn.mpesaReceiptNumber || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(txn.createdAt).toLocaleDateString()}
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

          {/* New Payment Tab */}
          <TabsContent value="initiate" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STK Push Card */}
              <Card className="p-6 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setPaymentType("stk");
                  setDialogOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Phone size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">STK Push</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Send payment prompt to customer phone. They enter PIN to confirm.
                    </p>
                  </div>
                  <Button className="w-full gap-2">
                    <Send size={16} />
                    Initiate STK Push
                  </Button>
                </div>
              </Card>

              {/* C2B Card */}
              <Card className="p-6 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setPaymentType("c2b");
                  setDialogOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Phone size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">C2B Payment</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Customer to Business payment. Customer initiates payment to your till.
                    </p>
                  </div>
                  <Button className="w-full gap-2" variant="outline">
                    <Send size={16} />
                    Create C2B
                  </Button>
                </div>
              </Card>

              {/* B2B Card */}
              <Card className="p-6 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setPaymentType("b2b");
                  setDialogOpen(true);
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">B2B Transfer</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Business to Business payment. Send funds to another business account.
                    </p>
                  </div>
                  <Button className="w-full gap-2" variant="outline">
                    <Send size={16} />
                    Create B2B
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {paymentType === "stk" && (
            <>
              <DialogHeader>
                <DialogTitle>STK Push Payment</DialogTitle>
                <DialogDescription>
                  Send a payment prompt to customer phone
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    placeholder="0722000000 or +254722000000"
                    value={stkForm.phoneNumber}
                    onChange={(e) =>
                      setStkForm({ ...stkForm, phoneNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (KES)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={stkForm.amount}
                    onChange={(e) =>
                      setStkForm({ ...stkForm, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Reference
                  </label>
                  <Input
                    placeholder="Invoice, Ticket ID, etc."
                    value={stkForm.accountReference}
                    onChange={(e) =>
                      setStkForm({
                        ...stkForm,
                        accountReference: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Input
                    placeholder="Payment for..."
                    value={stkForm.transactionDescription}
                    onChange={(e) =>
                      setStkForm({
                        ...stkForm,
                        transactionDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiateSTKPush}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading && <Clock size={16} className="animate-spin" />}
                  {loading ? "Processing..." : "Send STK Push"}
                </Button>
              </DialogFooter>
            </>
          )}

          {paymentType === "c2b" && (
            <>
              <DialogHeader>
                <DialogTitle>C2B Payment</DialogTitle>
                <DialogDescription>
                  Customer to Business payment request
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Customer Phone Number
                  </label>
                  <Input
                    placeholder="0722000000 or +254722000000"
                    value={c2bForm.phoneNumber}
                    onChange={(e) =>
                      setC2bForm({ ...c2bForm, phoneNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (KES)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={c2bForm.amount}
                    onChange={(e) =>
                      setC2bForm({ ...c2bForm, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Reference
                  </label>
                  <Input
                    placeholder="Invoice, Order ID, etc."
                    value={c2bForm.accountReference}
                    onChange={(e) =>
                      setC2bForm({
                        ...c2bForm,
                        accountReference: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Input
                    placeholder="Payment for..."
                    value={c2bForm.transactionDescription}
                    onChange={(e) =>
                      setC2bForm({
                        ...c2bForm,
                        transactionDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiateC2B}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading && <Clock size={16} className="animate-spin" />}
                  {loading ? "Processing..." : "Initiate C2B"}
                </Button>
              </DialogFooter>
            </>
          )}

          {paymentType === "b2b" && (
            <>
              <DialogHeader>
                <DialogTitle>B2B Transfer</DialogTitle>
                <DialogDescription>
                  Business to Business payment transfer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Receiver Short Code
                  </label>
                  <Input
                    placeholder="Business short code"
                    value={b2bForm.receiverShortCode}
                    onChange={(e) =>
                      setB2bForm({
                        ...b2bForm,
                        receiverShortCode: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Amount (KES)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={b2bForm.amount}
                    onChange={(e) =>
                      setB2bForm({ ...b2bForm, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Reference
                  </label>
                  <Input
                    placeholder="Reference ID"
                    value={b2bForm.accountReference}
                    onChange={(e) =>
                      setB2bForm({
                        ...b2bForm,
                        accountReference: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Input
                    placeholder="Transfer for..."
                    value={b2bForm.transactionDescription}
                    onChange={(e) =>
                      setB2bForm({
                        ...b2bForm,
                        transactionDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiateB2B}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading && <Clock size={16} className="animate-spin" />}
                  {loading ? "Processing..." : "Send Transfer"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
