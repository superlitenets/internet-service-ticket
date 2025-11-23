import { useState, useEffect } from "react";
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getExpirationClient,
  type ExpirationCheck,
  type ExpirationLog,
  type ExpirationStatus,
} from "@/lib/expiration-client";
import { MikrotikAccount } from "@shared/api";

interface AccountExpirationProps {
  accounts: MikrotikAccount[];
  instanceId?: string;
  gracePeriodDays?: number;
}

export function AccountExpiration({
  accounts,
  instanceId,
  gracePeriodDays = 0,
}: AccountExpirationProps) {
  const { toast } = useToast();
  const expirationClient = getExpirationClient();

  // State
  const [expirationChecks, setExpirationChecks] = useState<ExpirationCheck[]>([]);
  const [automationStatus, setAutomationStatus] = useState<ExpirationStatus>({
    totalChecks: 0,
    expiredAccounts: 0,
    activeExpiredAccounts: 0,
    totalLogs: 0,
    successCount: 0,
    failureCount: 0,
  });
  const [automationLogs, setAutomationLogs] = useState<ExpirationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedAccountForRenewal, setSelectedAccountForRenewal] = useState<string>("");
  const [newBillingDate, setNewBillingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [processingExpirations, setProcessingExpirations] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Load expiration status and logs on mount and when accounts change
  useEffect(() => {
    loadExpirationData();
  }, [accounts, instanceId]);

  const loadExpirationData = async () => {
    try {
      setLoading(true);
      const [statusData, logsData] = await Promise.all([
        expirationClient.getStatus(instanceId),
        expirationClient.getLogs(instanceId, undefined, 50),
      ]);

      setAutomationStatus(statusData.status);
      setAutomationLogs(logsData.logs);
    } catch (error) {
      console.error("Failed to load expiration data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExpirationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await expirationClient.checkExpirationStatus(
        instanceId,
        gracePeriodDays
      );

      setExpirationChecks(response.checks);
      toast({
        title: "Status Checked",
        description: `Found ${response.summary.expiredAccounts} expired accounts (${response.summary.activeExpiredAccounts} active)`,
      });
    } catch (error) {
      console.error("Failed to check expiration status:", error);
      toast({
        title: "Error",
        description: "Failed to check expiration status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleProcessExpirations = async () => {
    try {
      setProcessingExpirations(true);
      const response = await expirationClient.processExpirations(
        instanceId,
        gracePeriodDays,
        true
      );

      toast({
        title: "Expirations Processed",
        description: `Suspended ${response.result.suspendedCount} expired accounts (${response.result.failedCount} failed)`,
      });

      // Reload data
      await loadExpirationData();
      await handleCheckExpirationStatus();
    } catch (error) {
      console.error("Failed to process expirations:", error);
      toast({
        title: "Error",
        description: "Failed to process expirations",
        variant: "destructive",
      });
    } finally {
      setProcessingExpirations(false);
    }
  };

  const handleRenewAccount = async () => {
    if (!selectedAccountForRenewal || !newBillingDate) {
      toast({
        title: "Error",
        description: "Please select an account and billing date",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await expirationClient.processRenewal(
        selectedAccountForRenewal,
        newBillingDate,
        instanceId
      );

      if (response.success) {
        toast({
          title: "Account Renewed",
          description: response.message,
        });

        // Reset form
        setShowRenewalDialog(false);
        setSelectedAccountForRenewal("");
        setNewBillingDate(new Date().toISOString().split("T")[0]);

        // Reload data
        await loadExpirationData();
        await handleCheckExpirationStatus();
      } else {
        toast({
          title: "Warning",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to renew account:", error);
      toast({
        title: "Error",
        description: "Failed to process account renewal",
        variant: "destructive",
      });
    }
  };

  const expiredAccountsCount = expirationChecks.filter((c) => c.isExpired).length;
  const activeExpiredCount = expirationChecks.filter((c) => c.shouldBeSuspended).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Expiration Status
            </p>
            <p className="text-2xl font-bold">
              {expirationChecks.length > 0 ? expiredAccountsCount : "—"}
            </p>
            <p className="text-xs text-red-600">
              {expiredAccountsCount > 0 && `${expiredAccountsCount} expired`}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Active Expired
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {expirationChecks.length > 0 ? activeExpiredCount : "—"}
            </p>
            <p className="text-xs text-orange-600">
              {activeExpiredCount > 0 && "Needs suspension"}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Automation Logs
            </p>
            <p className="text-2xl font-bold">{automationStatus.totalLogs}</p>
            <p className="text-xs text-green-600">
              {automationStatus.successCount} successful
            </p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Failure Rate
            </p>
            <p className="text-2xl font-bold text-red-600">
              {automationStatus.totalLogs > 0
                ? (
                    (automationStatus.failureCount / automationStatus.totalLogs) *
                    100
                  ).toFixed(0)
                : "0"}
              %
            </p>
            <p className="text-xs text-red-600">
              {automationStatus.failureCount} failed
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Account Expiration Management</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCheckExpirationStatus}
              disabled={checkingStatus}
              variant="outline"
              size="sm"
            >
              {checkingStatus && <Loader size={16} className="mr-2 animate-spin" />}
              Check Expiration Status
            </Button>
            <Button
              onClick={handleProcessExpirations}
              disabled={processingExpirations || activeExpiredCount === 0}
              variant="destructive"
              size="sm"
            >
              {processingExpirations && <Loader size={16} className="mr-2 animate-spin" />}
              Process Expirations ({activeExpiredCount})
            </Button>
            <Button
              onClick={() => setShowRenewalDialog(true)}
              variant="default"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Renew Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Expiration Checks Table */}
      {expirationChecks.length > 0 && (
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Expiration Status Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left font-medium">Account</th>
                    <th className="py-3 px-4 text-left font-medium">
                      Next Billing
                    </th>
                    <th className="py-3 px-4 text-center font-medium">
                      Status
                    </th>
                    <th className="py-3 px-4 text-center font-medium">
                      Overdue Days
                    </th>
                    <th className="py-3 px-4 text-center font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expirationChecks.map((check) => (
                    <tr
                      key={check.accountId}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{check.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {check.customerName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-muted-foreground" />
                          {check.nextBillingDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            check.currentStatus === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {check.currentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {check.isExpired ? (
                          <span className="text-red-600 font-medium">
                            {check.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-green-600">Not expired</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {check.isExpired && (
                          <AlertCircle
                            size={16}
                            className="text-red-600 inline-block"
                          />
                        )}
                        {!check.isExpired && (
                          <CheckCircle2
                            size={16}
                            className="text-green-600 inline-block"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Automation Logs */}
      {automationLogs.length > 0 && (
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Automation Logs</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {automationLogs.slice().reverse().map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg text-sm"
                >
                  <div className="mt-1">
                    {log.status === "success" ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : log.status === "pending" ? (
                      <Clock size={16} className="text-blue-600" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.accountNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Renewal Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Account</DialogTitle>
            <DialogDescription>
              Process renewal for a suspended or expired account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Account</label>
              <select
                value={selectedAccountForRenewal}
                onChange={(e) => setSelectedAccountForRenewal(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Choose an account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountNumber} - {account.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Billing Date</label>
              <Input
                type="date"
                value={newBillingDate}
                onChange={(e) => setNewBillingDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenewalDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenewAccount}>Process Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
