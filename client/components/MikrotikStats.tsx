import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  PhoneOff,
  Phone,
  Loader,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikStats,
  getRouterOSPPPoEConnections,
  getRouterOSHotspotUsers,
} from "@/lib/mikrotik-client";
import { getExpirationClient } from "@/lib/expiration-client";
import { getDefaultMikrotikInstance } from "@/lib/mikrotik-instances-storage";
import { Link } from "react-router-dom";

export function MikrotikStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    totalRevenue: 0,
    expiredAccounts: 0,
    pppoeOnline: 0,
    hotspotOnline: 0,
  });

  useEffect(() => {
    loadMikrotikStats();
  }, []);

  const loadMikrotikStats = async () => {
    try {
      setLoading(true);
      const defaultInstance = getDefaultMikrotikInstance();
      const instanceId = defaultInstance?.id;

      const [mikrotikData, pppoeData, hotspotData, expirationData] =
        await Promise.all([
          getMikrotikStats(instanceId),
          getRouterOSPPPoEConnections(instanceId),
          getRouterOSHotspotUsers(instanceId),
          getExpirationClient().getStatus(instanceId),
        ]);

      setStats({
        totalAccounts: mikrotikData.totalAccounts || 0,
        activeAccounts: mikrotikData.activeAccounts || 0,
        totalRevenue: mikrotikData.totalRevenue || 0,
        expiredAccounts: expirationData.status?.expiredAccounts || 0,
        pppoeOnline: pppoeData?.connections || pppoeData?.length || 0,
        hotspotOnline: hotspotData?.users || hotspotData?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load Mikrotik stats:", error);
      toast({
        title: "Info",
        description: "Mikrotik statistics will load when configured",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wifi size={24} className="text-blue-600" />
              Mikrotik ISP
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time ISP account and connection statistics
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader size={32} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wifi size={24} className="text-blue-600" />
            Mikrotik ISP
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time ISP account and connection statistics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMikrotikStats}>
          Refresh
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Accounts */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Total Accounts
              </p>
              <Users size={16} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalAccounts}
            </p>
            <p className="text-xs text-green-600">Registered</p>
          </div>
        </Card>

        {/* Active Accounts */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Active
              </p>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.activeAccounts}
            </p>
            <p className="text-xs text-green-600">
              {stats.totalAccounts > 0
                ? ((stats.activeAccounts / stats.totalAccounts) * 100).toFixed(
                    0,
                  )
                : 0}
              % active
            </p>
          </div>
        </Card>

        {/* Expired Accounts */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Expired
              </p>
              <Clock size={16} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.expiredAccounts}
            </p>
            <p className="text-xs text-orange-600">Need renewal</p>
          </div>
        </Card>

        {/* PPPoE Online */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                PPPoE Online
              </p>
              <Phone size={16} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.pppoeOnline}
            </p>
            <p className="text-xs text-green-600">Connected</p>
          </div>
        </Card>

        {/* Hotspot Online */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Hotspot Online
              </p>
              <PhoneOff size={16} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.hotspotOnline}
            </p>
            <p className="text-xs text-blue-600">Connected</p>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Revenue
              </p>
              <TrendingUp size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              KES {(stats.totalRevenue / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-purple-600">Monthly</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/mikrotik/accounts">
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="space-y-3">
              <Users size={24} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Manage Accounts
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Create, edit, and manage customer accounts
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/mikrotik/billing">
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="space-y-3">
              <TrendingUp size={24} className="text-green-600" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Billing & Invoices
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  View invoices and manage billing automation
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/mikrotik/monitoring">
          <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="space-y-3">
              <AlertCircle size={24} className="text-orange-600" />
              <div>
                <h3 className="font-semibold text-foreground">Monitoring</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Monitor bandwidth usage and analytics
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Status Info */}
      {(stats.expiredAccounts > 0 ||
        stats.activeAccounts + stats.pppoeOnline + stats.hotspotOnline ===
          0) && (
        <Card className="p-4 border-l-4 border-l-orange-600 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-orange-600 mt-1 flex-shrink-0"
            />
            <div>
              <h4 className="font-semibold text-orange-900">Action Required</h4>
              {stats.expiredAccounts > 0 && (
                <p className="text-sm text-orange-800 mt-1">
                  {stats.expiredAccounts} account
                  {stats.expiredAccounts !== 1 ? "s" : ""} have expired.
                  <Link
                    to="/settings"
                    className="font-semibold hover:underline ml-1"
                  >
                    Review expiration settings
                  </Link>
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
