import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikAccounts,
  getMikrotikPlans,
  createMikrotikAccount,
} from "@/lib/mikrotik-client";
import { MikrotikAccount, MikrotikPlan } from "@shared/api";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";
import { getCompanyPrefix } from "@/lib/company-settings-storage";

export default function MikrotikAccountsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [mikrotikInstances, setMikrotikInstances] = useState<MikrotikInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<MikrotikInstance | null>(null);
  const [accounts, setAccounts] = useState<MikrotikAccount[]>([]);
  const [plans, setPlans] = useState<MikrotikPlan[]>([]);
  const [newAccountDialog, setNewAccountDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [selectedDeleteAccount, setSelectedDeleteAccount] = useState<string>("");

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    accountType: "residential" as const,
    planId: "",
  });

  useEffect(() => {
    const instances = getMikrotikInstances();
    setMikrotikInstances(instances);
    const defaultInstance = getDefaultMikrotikInstance();
    setSelectedInstance(defaultInstance);
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadAccounts();
      loadPlans();
    }
  }, [selectedInstance]);

  const loadAccounts = async () => {
    if (!selectedInstance) return;
    try {
      setLoading(true);
      const accountsData = await getMikrotikAccounts(selectedInstance.id);
      setAccounts(accountsData);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    if (!selectedInstance) return;
    try {
      const plansData = await getMikrotikPlans(selectedInstance.id);
      setPlans(plansData);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance) return;

    try {
      setLoading(true);
      const newAccount = await createMikrotikAccount({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        accountType: formData.accountType,
        planId: formData.planId,
        instanceId: selectedInstance.id,
      });

      setAccounts((prev) => [...prev, newAccount]);
      setNewAccountDialog(false);
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        accountType: "residential",
        planId: "",
      });
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    } catch (err) {
      console.error("Failed to create account:", err);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mikrotik Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage ISP customer accounts and subscriptions
          </p>
        </div>

        {/* Instance Selector */}
        {selectedInstance && (
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Router</p>
                <p className="text-lg font-semibold text-foreground">
                  {selectedInstance.label}
                </p>
              </div>
              <Badge variant="outline">{selectedInstance.ipAddress}</Badge>
            </div>
          </Card>
        )}

        {/* Accounts Section */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Active Accounts ({filteredAccounts.length})
              </h3>
              <Button
                onClick={() => setNewAccountDialog(true)}
                size="sm"
                className="gap-2"
              >
                <Plus size={16} />
                New Account
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by customer name or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left font-medium">Account #</th>
                    <th className="py-3 px-4 text-left font-medium">Customer</th>
                    <th className="py-3 px-4 text-left font-medium">Phone</th>
                    <th className="py-3 px-4 text-center font-medium">Status</th>
                    <th className="py-3 px-4 text-right font-medium">Balance</th>
                    <th className="py-3 px-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No accounts found
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr
                        key={account.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/mikrotik/accounts/${account.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">
                          {account.accountNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{account.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.customerEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {account.customerPhone}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              account.status === "active" ? "default" : "secondary"
                            }
                          >
                            {account.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              account.outstandingBalance > 0
                                ? "text-red-600 font-medium"
                                : "text-green-600 font-medium"
                            }
                          >
                            KES {account.outstandingBalance.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeleteAccount(account.id);
                              setDeleteAccountDialog(true);
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* New Account Dialog */}
      <Dialog open={newAccountDialog} onOpenChange={setNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new customer account to the ISP system
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Name
                </label>
                <Input
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  required
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plan</label>
                <select
                  required
                  value={formData.planId}
                  onChange={(e) =>
                    setFormData({ ...formData, planId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName} - KES {plan.monthlyFee}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="residential">Residential</option>
                <option value="business">Business</option>
                <option value="prepaid">Prepaid</option>
                <option value="postpaid">Postpaid</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewAccountDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
