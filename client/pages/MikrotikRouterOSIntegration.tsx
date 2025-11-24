import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Network,
  Activity,
  Users,
  Zap,
  Server,
  Clock,
  TrendingUp,
  Loader,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getMikrotikInstances,
  getDefaultMikrotikInstance,
  type MikrotikInstance,
} from "@/lib/mikrotik-instances-storage";

// Mock data for demonstrations
const mockBandwidthData = [
  { time: "00:00", upload: 120, download: 240 },
  { time: "04:00", upload: 180, download: 320 },
  { time: "08:00", upload: 280, download: 420 },
  { time: "12:00", upload: 350, download: 520 },
  { time: "16:00", upload: 420, download: 380 },
  { time: "20:00", upload: 310, download: 480 },
  { time: "23:59", upload: 150, download: 220 },
];

const mockInterfaceStats = [
  { name: "ether1", traffic: 45, color: "#3b82f6" },
  { name: "ether2", traffic: 25, color: "#10b981" },
  { name: "ether3", traffic: 18, color: "#f59e0b" },
  { name: "bridge", traffic: 12, color: "#8b5cf6" },
];

const mockConnectionStats = [
  { time: "00:00", connections: 45 },
  { time: "06:00", connections: 52 },
  { time: "12:00", connections: 78 },
  { time: "18:00", connections: 95 },
  { time: "23:59", connections: 65 },
];

export default function MikrotikRouterOSIntegrationPage() {
  const { toast } = useToast();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [instances, setInstances] = useState<MikrotikInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<MikrotikInstance | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  // Load instances on mount
  useEffect(() => {
    const allInstances = getMikrotikInstances();
    setInstances(allInstances);

    const defaultInstance = getDefaultMikrotikInstance();
    if (defaultInstance) {
      setSelectedInstanceId(defaultInstance.id);
      setSelectedInstance(defaultInstance);
    }
  }, []);

  // Update selected instance
  useEffect(() => {
    const instance = instances.find((i) => i.id === selectedInstanceId);
    if (instance) {
      setSelectedInstance(instance);
    }
  }, [selectedInstanceId, instances]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Success",
        description: "RouterOS connection successful",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to RouterOS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            RouterOS Integration
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage Mikrotik RouterOS instances with live statistics and analytics
          </p>
        </div>

        {/* Instance Selector */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-48">
            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select RouterOS Instance" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading || !selectedInstance}
              variant="outline"
              className="gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Refresh Data
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={loading || !selectedInstance}
              variant="outline"
              className="gap-2"
            >
              <Network size={16} />
              Test Connection
            </Button>
          </div>
        </div>

        {/* Instance Status Card */}
        {selectedInstance && (
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Server size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instance</p>
                  <p className="font-semibold text-foreground">{selectedInstance.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">Connected</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="font-semibold text-foreground">45 days 12h</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API URL</p>
                  <p className="font-semibold text-foreground text-sm">
                    {selectedInstance.apiUrl}:{selectedInstance.port}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger value="overview" className="gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bandwidth" className="gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Bandwidth</span>
            </TabsTrigger>
            <TabsTrigger value="interfaces" className="gap-2">
              <Network size={16} />
              <span className="hidden sm:inline">Interfaces</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* CPU Usage */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">CPU Usage</p>
                    <p className="text-3xl font-bold text-foreground">42%</p>
                    <p className="text-xs text-muted-foreground mt-1">Last update: 2s ago</p>
                  </div>
                  <div className="text-orange-500">
                    <Zap size={32} />
                  </div>
                </div>
              </Card>

              {/* Memory Usage */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Memory Usage</p>
                    <p className="text-3xl font-bold text-foreground">58%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      1.2GB / 2GB
                    </p>
                  </div>
                  <div className="text-blue-500">
                    <Server size={32} />
                  </div>
                </div>
              </Card>

              {/* Active Connections */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Active Connections
                    </p>
                    <p className="text-3xl font-bold text-foreground">78</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +3 since yesterday
                    </p>
                  </div>
                  <div className="text-green-500">
                    <Users size={32} />
                  </div>
                </div>
              </Card>

              {/* Total Bandwidth */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Bandwidth
                    </p>
                    <p className="text-3xl font-bold text-foreground">2.4 Gb/s</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Peak: 3.2 Gb/s
                    </p>
                  </div>
                  <div className="text-purple-500">
                    <TrendingUp size={32} />
                  </div>
                </div>
              </Card>
            </div>

            {/* System Health */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                System Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="text-sm font-medium">API Service</span>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="text-sm font-medium">Network Status</span>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="text-sm font-medium">Authentication</span>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Authenticated
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Bandwidth Tab */}
          <TabsContent value="bandwidth" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Bandwidth Usage (24h)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockBandwidthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="download"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Download (Mb/s)"
                  />
                  <Line
                    type="monotone"
                    dataKey="upload"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Upload (Mb/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground mb-2">Avg Download</p>
                <p className="text-2xl font-bold text-foreground">368 Mb/s</p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground mb-2">Avg Upload</p>
                <p className="text-2xl font-bold text-foreground">243 Mb/s</p>
              </Card>
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-sm text-muted-foreground mb-2">Peak Usage</p>
                <p className="text-2xl font-bold text-foreground">520 Mb/s</p>
              </Card>
            </div>
          </TabsContent>

          {/* Interfaces Tab */}
          <TabsContent value="interfaces" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Interface Traffic Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockInterfaceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, traffic }) => `${name}: ${traffic}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="traffic"
                  >
                    {mockInterfaceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Interface Details
              </h3>
              <div className="space-y-3">
                {mockInterfaceStats.map((iface) => (
                  <div
                    key={iface.name}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: iface.color }}
                      ></div>
                      <span className="font-medium text-foreground">
                        {iface.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {iface.traffic}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((iface.traffic / 100) * 2.4 * 10) / 10} Gb/s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Active Connections Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockConnectionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="connections"
                    fill="#3b82f6"
                    name="Active Connections"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Connection Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="text-3xl font-bold text-blue-600">95</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground">24h Peak</p>
                  <p className="text-3xl font-bold text-green-600">128</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-3xl font-bold text-orange-600">72</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
