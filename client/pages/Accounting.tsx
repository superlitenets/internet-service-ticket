import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import {
  ChartOfAccount,
  JournalEntry,
  Expense,
  POSTransaction,
  AccountingSummary,
} from "@shared/api";

export function AccountingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [summaryRes, accountsRes, ledgerRes, expensesRes, posRes] =
        await Promise.all([
          fetch("/api/accounting/summary"),
          fetch("/api/accounting/accounts"),
          fetch("/api/accounting/ledger"),
          fetch("/api/accounting/expenses"),
          fetch("/api/pos/transactions"),
        ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (accountsRes.ok) setChartOfAccounts(await accountsRes.json());
      if (ledgerRes.ok) setJournalEntries(await ledgerRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (posRes.ok) setPosTransactions(await posRes.json());
    } catch (err) {
      console.error("Failed to load accounting data:", err);
      toast({
        title: "Error",
        description: "Failed to load accounting data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!summary) return [];

    return [
      { name: "Assets", value: summary.totalAssets || 0 },
      { name: "Liabilities", value: summary.totalLiabilities || 0 },
      { name: "Equity", value: summary.totalEquity || 0 },
    ];
  };

  const prepareRevenueData = () => {
    if (!summary) return [];

    return [
      { name: "Revenue", value: summary.totalRevenue || 0 },
      { name: "Expenses", value: summary.totalExpenses || 0 },
      { name: "Net Profit", value: summary.netProfit || 0 },
    ];
  };

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
        <p className="text-muted-foreground mt-2">
          Manage invoices, expenses, general ledger, and POS transactions
        </p>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {summary.totalAssets.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                KES {summary.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                KES {summary.totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                KES {summary.netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp size={16} />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <FileText size={16} />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <Receipt size={16} />
            <span className="hidden sm:inline">Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <DollarSign size={16} />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="gap-2">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">POS</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Sheet Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prepareChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value.toFixed(0)}`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest journal entries and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.slice(0, 5).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>KES {entry.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "posted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart of Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Chart of Accounts</h2>
            <Button className="gap-2">
              <Plus size={16} />
              New Account
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartOfAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.accountCode}
                      </TableCell>
                      <TableCell>{account.accountName}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell>{account.category}</TableCell>
                      <TableCell className="font-medium">
                        KES {account.balance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.enabled ? "default" : "secondary"
                          }
                        >
                          {account.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Ledger Tab */}
        <TabsContent value="ledger" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">General Ledger</h2>
            <Button className="gap-2">
              <Plus size={16} />
              New Entry
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit Account</TableHead>
                    <TableHead>Credit Account</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.debitAccountCode}</TableCell>
                      <TableCell>{entry.creditAccountCode}</TableCell>
                      <TableCell className="font-medium">
                        KES {entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "posted"
                              ? "default"
                              : entry.status === "reversed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Expenses</h2>
            <Button className="gap-2">
              <Plus size={16} />
              New Expense
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.expenseNumber}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="font-medium">
                        KES {expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell>
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === "approved"
                              ? "default"
                              : expense.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POS Tab */}
        <TabsContent value="pos" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">POS Transactions</h2>
            <Button className="gap-2">
              <Plus size={16} />
              New Transaction
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.receiptNumber}
                      </TableCell>
                      <TableCell>{transaction.customerName || "-"}</TableCell>
                      <TableCell>KES {transaction.subtotal.toFixed(2)}</TableCell>
                      <TableCell>KES {transaction.taxAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">
                        KES {transaction.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        {new Date(
                          transaction.transactionDate,
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
