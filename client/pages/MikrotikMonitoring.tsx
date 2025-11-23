import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getMonitoringStatus,
  getDashboardAnalytics,
  getRevenueAnalytics,
} from "@/lib/mikrotik-client";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";

export default function MikrotikMonitoringPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bandwidth");
  const [loading, setLoading] = useState(false);

  const [selectedInstance, setSelectedInstance] = useState<MikrotikInstance | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const defaultInstance = getDefaultMikrotikInstance();
    setSelectedInstance(defaultInstance);
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadMonitoringData();
    }
  }, [selectedInstance]);

  const loadMonitoringData = async () => {
    if (!selectedInstance) return;
    try {
      setLoading(true);
      const [monitoringData, dashboardData] = await Promise.all([
        getMonitoringStatus(selectedInstance.id),
        getDashboardAnalytics(selectedInstance.id),
      ]);

      setMonitoringStatus(monitoringData);
      setAnalyticsData(dashboardData);
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
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
          <h1 className="text-3xl font-bold text-foreground">Mikrotik Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor bandwidth usage and view analytics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {monitoringStatus && (
            <>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Active Accounts
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {monitoringStatus.activeAccounts || 0}
                </p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Monitoring Status
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {monitoringStatus.isMonitoring ? "Active" : "Inactive"}
                </p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  Update Frequency
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {monitoringStatus.updateInterval || "60"}s
                </p>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bandwidth" className="gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Bandwidth</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Bandwidth Tab */}
          <TabsContent value="bandwidth" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Bandwidth Monitoring
                  </h3>
                  <Button
                    onClick={loadMonitoringData}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Loader size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <TrendingUp size={32} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Bandwidth monitoring data will appear here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enable monitoring to track real-time bandwidth usage
                  </p>
                </div>

                {monitoringStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Start Monitoring
                      </h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Enable bandwidth monitoring for active accounts
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                      >
                        {monitoringStatus.isMonitoring ? "Stop" : "Start"} Monitoring
                      </Button>
                    </Card>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Set Alerts
                      </h4>
                      <p className="text-sm text-green-800 mb-3">
                        Configure bandwidth quota alerts
                      </p>
                      <Button size="sm" variant="outline">
                        Configure Alerts
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Analytics Dashboard
                  </h3>
                  <Button
                    onClick={loadMonitoringData}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Loader size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                  </Button>
                </div>

                {analyticsData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">
                        Total Accounts
                      </p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {analyticsData.accounts?.totalAccounts || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-green-600 font-medium">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        KES {analyticsData.revenue?.totalRevenue?.toFixed(2) || "0"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium">
                        Pending Payments
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        KES {analyticsData.payments?.totalPending?.toFixed(2) || "0"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-8 text-center mt-6">
                  <TrendingUp size={32} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Detailed analytics charts will appear here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    View revenue trends, account growth, and payment patterns
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
