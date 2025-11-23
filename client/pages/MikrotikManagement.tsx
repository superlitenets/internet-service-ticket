import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Clock, Network, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getNotificationStatsAPI } from "@/lib/mikrotik-client";
import { AccountExpiration } from "@/components/AccountExpiration";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";
import { getMikrotikAccounts } from "@/lib/mikrotik-client";
import { MikrotikAccount } from "@shared/api";

export default function MikrotikManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(false);

  const [selectedInstance, setSelectedInstance] =
    useState<MikrotikInstance | null>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [accounts, setAccounts] = useState<MikrotikAccount[]>([]);

  useEffect(() => {
    const defaultInstance = getDefaultMikrotikInstance();
    setSelectedInstance(defaultInstance);
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadManagementData();
    }
  }, [selectedInstance]);

  const loadManagementData = async () => {
    if (!selectedInstance) return;
    try {
      setLoading(true);
      const [statsData, accountsData] = await Promise.all([
        getNotificationStatsAPI(selectedInstance.id),
        getMikrotikAccounts(selectedInstance.id),
      ]);

      setNotificationStats(statsData);
      setAccounts(accountsData);
    } catch (err) {
      console.error("Failed to load management data:", err);
      toast({
        title: "Error",
        description: "Failed to load management data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Mikrotik Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage notifications, expiration handling, and router settings
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notificationStats && (
            <>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Total Sent
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {notificationStats.totalSent || 0}
                </p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Today Sent
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {notificationStats.todaySent || 0}
                </p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {notificationStats.totalFailed || 0}
                </p>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="expiration" className="gap-2">
              <Clock size={16} />
              <span className="hidden sm:inline">Expiration</span>
            </TabsTrigger>
            <TabsTrigger value="routeros" className="gap-2">
              <Network size={16} />
              <span className="hidden sm:inline">RouterOS</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Notification Management
                </h3>

                {notificationStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">
                        Total Sent
                      </p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">
                        {notificationStats.totalSent}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-600 font-medium">
                        Today Sent
                      </p>
                      <p className="text-2xl font-bold text-green-900 mt-2">
                        {notificationStats.todaySent}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 font-medium">Failed</p>
                      <p className="text-2xl font-bold text-red-900 mt-2">
                        {notificationStats.totalFailed}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Invoice Notifications
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Send invoice notifications to customers
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                  <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Payment Reminders
                    </h4>
                    <p className="text-sm text-green-800 mb-3">
                      Send automatic payment reminders
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Overdue Alerts
                    </h4>
                    <p className="text-sm text-purple-800 mb-3">
                      Send alerts for overdue accounts
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                  <Card className="p-4 bg-orange-50 border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Quota Alerts
                    </h4>
                    <p className="text-sm text-orange-800 mb-3">
                      Send bandwidth quota warnings
                    </p>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Expiration Tab */}
          <TabsContent value="expiration" className="space-y-6">
            <AccountExpiration
              accounts={accounts}
              instanceId={selectedInstance?.id}
            />
          </TabsContent>

          {/* RouterOS Tab */}
          <TabsContent value="routeros" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  RouterOS Settings
                </h3>

                {selectedInstance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Connected Router
                    </p>
                    <p className="text-lg font-semibold text-blue-900">
                      {selectedInstance.label}
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      {selectedInstance.ipAddress}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Test Connection
                    </h4>
                    <p className="text-sm text-green-800 mb-3">
                      Verify router connectivity and authentication
                    </p>
                    <Button size="sm" variant="outline" disabled={loading}>
                      {loading && (
                        <Loader size={14} className="mr-2 animate-spin" />
                      )}
                      Test Connection
                    </Button>
                  </Card>
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Device Info
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      View device information and statistics
                    </p>
                    <Button size="sm" variant="outline">
                      View Info
                    </Button>
                  </Card>
                </div>

                <Card className="p-4 border mt-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    Configuration
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-green-600">
                        Connected
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">IP Address</span>
                      <span className="font-medium">
                        {selectedInstance?.ipAddress}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Last Sync</span>
                      <span className="font-medium">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
