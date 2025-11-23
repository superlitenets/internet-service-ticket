import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Pause,
  Play,
  RotateCcw,
  Copy,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  getMikrotikAccount,
  updateMikrotikAccount,
} from "@/lib/mikrotik-client";
import { MikrotikAccount } from "@shared/api";

export default function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [account, setAccount] = useState<MikrotikAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit customer details dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  // Change expiry dialog
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  // Pause/Resume dialog
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  // Reset MAC dialog
  const [showMacDialog, setShowMacDialog] = useState(false);
  const [newMac, setNewMac] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      if (!accountId) return;
      try {
        const data = await getMikrotikAccount(accountId);
        setAccount(data);
        setEditForm({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
        });
        if (data.nextBillingDate) {
          setExpiryDate(data.nextBillingDate.split("T")[0]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load account details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [accountId]);

  // Handle edit customer details
  const handleEditCustomer = async () => {
    if (!account) return;
    try {
      setSaving(true);
      const updated = await updateMikrotikAccount(account.id, editForm);
      setAccount(updated);
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Customer details updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle change expiry
  const handleChangeExpiry = async () => {
    if (!account || !expiryDate) return;
    try {
      setSaving(true);
      const updated = await updateMikrotikAccount(account.id, {
        nextBillingDate: new Date(expiryDate).toISOString(),
      });
      setAccount(updated);
      setShowExpiryDialog(false);
      toast({
        title: "Success",
        description: "Expiry date updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expiry date",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle pause/resume account
  const handleTogglePause = async () => {
    if (!account) return;
    try {
      setSaving(true);
      const newStatus =
        account.status === "paused" ? "active" : "paused";
      const updated = await updateMikrotikAccount(account.id, {
        status: newStatus as "active" | "inactive" | "suspended" | "closed" | "paused",
      });
      setAccount(updated);
      setShowPauseDialog(false);
      setPauseReason("");
      toast({
        title: "Success",
        description: `Account ${newStatus === "paused" ? "paused" : "resumed"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${account.status === "paused" ? "resume" : "pause"} account`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle reset MAC address
  const handleResetMac = async () => {
    if (!account || !newMac) return;
    try {
      setSaving(true);
      const updated = await updateMikrotikAccount(account.id, {
        macAddress: newMac,
      });
      setAccount(updated);
      setShowMacDialog(false);
      setNewMac("");
      toast({
        title: "Success",
        description: "MAC address updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update MAC address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate random MAC address
  const generateRandomMac = () => {
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    const mac = Array.from({ length: 6 })
      .map(() => `${hex()}${hex()}`)
      .join(":");
    setNewMac(mac.toUpperCase());
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Success",
      description: "Copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-semibold">Account Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The account you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/mikrotik")} className="w-full">
              Back to Accounts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/mikrotik")}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {account.accountNumber}
          </h1>
          <p className="text-muted-foreground">{account.customerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Profile Card */}
          <Card className="p-8 border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <div className="space-y-8">
              {/* Header with Avatar and Name */}
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {account.customerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  </div>

                  {/* Name and Account Type */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {account.customerName}
                    </h2>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="capitalize bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {account.accountType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Since {new Date(account.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="gap-2 whitespace-nowrap"
                >
                  <Edit size={16} />
                  Edit Details
                </Button>
              </div>

              {/* Contact Information */}
              <div className="border-t border-border pt-8">
                <h3 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-wide">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Email Address
                    </p>
                    <p className="text-base font-medium text-foreground">
                      {account.customerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Primary contact
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Phone Number
                    </p>
                    <p className="text-base font-medium text-foreground">
                      {account.customerPhone}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mobile
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Billing & Service Details */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Billing & Service Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Plan</p>
                <p className="font-medium text-foreground">{account.planName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Monthly Fee
                </p>
                <p className="font-medium text-foreground">
                  KES {account.monthlyFee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Registration Date
                </p>
                <p className="font-medium text-foreground">
                  {new Date(account.registrationDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Next Billing Date
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {account.nextBillingDate
                      ? new Date(account.nextBillingDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExpiryDialog(true)}
                    className="gap-1"
                  >
                    <Calendar size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* PPPoE & Hotspot Credentials */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Access Credentials
            </h2>

            <div className="space-y-6">
              {/* PPPoE */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  PPPoE Access
                </p>
                <div className="bg-muted/50 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="font-mono text-sm">{account.pppoeUsername}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(account.pppoeUsername || "")
                      }
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Password</p>
                      <p className="font-mono text-sm">
                        {showPassword
                          ? account.pppoePassword
                          : "•".repeat(
                              account.pppoePassword?.length || 12
                            )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hotspot */}
              {account.hotspotUsername && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Hotspot Access
                  </p>
                  <div className="bg-muted/50 rounded p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Username</p>
                        <p className="font-mono text-sm">
                          {account.hotspotUsername}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(account.hotspotUsername || "")
                        }
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Account Status
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge
                  variant={
                    account.status === "active"
                      ? "default"
                      : account.status === "paused"
                        ? "secondary"
                        : "destructive"
                  }
                  className="capitalize"
                >
                  {account.status}
                </Badge>
              </div>

              <Button
                onClick={() => setShowPauseDialog(true)}
                variant={account.status === "paused" ? "outline" : "destructive"}
                className="w-full gap-2"
              >
                {account.status === "paused" ? (
                  <>
                    <Play size={16} />
                    Resume Account
                  </>
                ) : (
                  <>
                    <Pause size={16} />
                    Pause Account
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Network Configuration Card */}
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Network Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  MAC Address
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm">
                    {account.macAddress || "Not set"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMacDialog(true)}
                    className="gap-1"
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </div>

              {account.ipAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    IP Address
                  </p>
                  <p className="font-mono text-sm">{account.ipAddress}</p>
                </div>
              )}

              {account.dataQuota && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Data Quota
                  </p>
                  <p className="font-mono text-sm">
                    {account.dataQuota} GB
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Balance Card */}
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Balance
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {account.balance.toLocaleString()}
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  Outstanding Balance
                </p>
                <p className="text-lg font-semibold text-destructive">
                  KES {account.outstandingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
            <DialogDescription>
              Update the customer information for this account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <Input
                value={editForm.customerName}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerName: e.target.value })
                }
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={editForm.customerEmail}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerEmail: e.target.value })
                }
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={editForm.customerPhone}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerPhone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCustomer} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Expiry Dialog */}
      <Dialog open={showExpiryDialog} onOpenChange={setShowExpiryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Expiry Date</DialogTitle>
            <DialogDescription>
              Set the next billing/expiry date for this account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Next Billing Date
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpiryDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeExpiry} disabled={saving}>
              {saving ? "Updating..." : "Update Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause/Resume Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {account.status === "paused" ? "Resume" : "Pause"} Account
            </DialogTitle>
            <DialogDescription>
              {account.status === "paused"
                ? "This will reactivate the account and restore service."
                : "This will temporarily disable the account. Service will be paused but not terminated."}
            </DialogDescription>
          </DialogHeader>

          {account.status !== "paused" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason (optional)
                </label>
                <Input
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Reason for pausing..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPauseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTogglePause}
              disabled={saving}
              variant={account.status === "paused" ? "default" : "destructive"}
            >
              {saving
                ? "Processing..."
                : account.status === "paused"
                  ? "Resume Account"
                  : "Pause Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset MAC Dialog */}
      <Dialog open={showMacDialog} onOpenChange={setShowMacDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset MAC Address</DialogTitle>
            <DialogDescription>
              Update or regenerate the MAC address for this account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                MAC Address
              </label>
              <Input
                value={newMac}
                onChange={(e) =>
                  setNewMac(e.target.value.toUpperCase())
                }
                placeholder="00:11:22:33:44:55"
                maxLength={17}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Format: XX:XX:XX:XX:XX:XX
              </p>
            </div>

            <Button
              variant="outline"
              onClick={generateRandomMac}
              className="w-full"
            >
              <RotateCcw size={14} className="mr-2" />
              Generate Random MAC
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMacDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetMac} disabled={saving || !newMac}>
              {saving ? "Updating..." : "Update MAC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
