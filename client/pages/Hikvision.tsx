import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Camera,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  testHikvisionConnection,
  getAccessControlEvents,
  type HikvisionDevice,
  type AccessControlEvent,
} from "@/lib/hikvision-client";

export default function HikvisionPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<AccessControlEvent[]>([]);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [deviceConfig, setDeviceConfig] = useState<HikvisionDevice>({
    ipAddress: "192.168.1.200",
    port: 8000,
    username: "admin",
    password: "",
    deviceType: "access_control",
    deviceName: "Entrance Access Control",
    location: "Main Entrance",
  });

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testHikvisionConnection(deviceConfig);

      if (result.success) {
        setDevices((prev) => [
          ...prev,
          {
            id: `hik-${Date.now()}`,
            ...deviceConfig,
            enabled: true,
            lastSync: new Date().toISOString(),
          },
        ]);

        toast({
          title: "Connection Successful",
          description: `✓ ${result.message}`,
        });
        setDeviceDialogOpen(false);
        // Reset form
        setDeviceConfig({
          ipAddress: "192.168.1.200",
          port: 8000,
          username: "admin",
          password: "",
          deviceType: "camera",
          deviceName: "Main Entrance Camera",
          location: "Front Gate",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to Hikvision device",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFetchAttendanceEvents = async () => {
    setLoadingEvents(true);
    try {
      const result = await getAccessControlEvents("hik-access-control");
      setAttendanceEvents(result.events);

      toast({
        title: "Success",
        description: `✓ Retrieved ${result.events.length} attendance records from Hikvision device`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch attendance events",
        variant: "destructive",
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes("entry") || eventType.includes("access")) {
      return <CheckCircle2 size={16} className="text-green-600" />;
    }
    if (eventType.includes("denied") || eventType.includes("alarm")) {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    return <Camera size={16} className="text-blue-600" />;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    if (status.toLowerCase().includes("success") || status.toLowerCase().includes("approved")) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (status.toLowerCase().includes("failed") || status.toLowerCase().includes("denied")) {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Hikvision Surveillance & Access Control
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage IP cameras, access control devices, and monitor surveillance events
            </p>
          </div>
          <Button
            onClick={() => setDeviceDialogOpen(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Add Device
          </Button>
        </div>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList>
            <TabsTrigger value="devices" className="gap-2">
              <Camera size={16} />
              Devices
            </TabsTrigger>
            <TabsTrigger value="access-control" className="gap-2">
              <Lock size={16} />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="surveillance" className="gap-2">
              <AlertTriangle size={16} />
              Surveillance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
              {devices.length === 0 ? (
                <p className="text-muted-foreground">No devices connected yet</p>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {device.deviceType === "camera" ? (
                          <Camera size={20} className="text-blue-600" />
                        ) : (
                          <Lock size={20} className="text-purple-600" />
                        )}
                        <div>
                          <p className="font-medium">{device.deviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.ipAddress}:{device.port} • {device.location}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        Connected
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="access-control" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Access Control Events</h2>
                <Button
                  onClick={handleFetchAccessEvents}
                  disabled={loadingEvents}
                  variant="outline"
                >
                  {loadingEvents ? "Loading..." : "Refresh Events"}
                </Button>
              </div>

              {accessEvents.length === 0 ? (
                <p className="text-muted-foreground">No access control events</p>
              ) : (
                <div className="space-y-3">
                  {accessEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 flex items-start gap-3"
                    >
                      <div className="mt-1">{getEventTypeIcon(event.eventType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.personName || "Unknown"}</p>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.eventTime).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.eventType} at {event.accessPoint || "Unknown"}
                        </p>
                        {event.cardNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Card: {event.cardNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="surveillance" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Surveillance Events</h2>
                <Button
                  onClick={handleFetchSurveillanceEvents}
                  disabled={loadingEvents}
                  variant="outline"
                >
                  {loadingEvents ? "Loading..." : "Refresh Events"}
                </Button>
              </div>

              {surveillanceEvents.length === 0 ? (
                <p className="text-muted-foreground">No surveillance events</p>
              ) : (
                <div className="space-y-3">
                  {surveillanceEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{event.eventType}</p>
                          <Badge className={`mt-2 ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.eventTime).toLocaleString()}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      {event.snapshotUrl && (
                        <img
                          src={event.snapshotUrl}
                          alt="Snapshot"
                          className="mt-2 rounded max-h-32 object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Device Dialog */}
        <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hikvision Device</DialogTitle>
              <DialogDescription>
                Configure a new Hikvision device (camera, access control, or NVR)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device Type</label>
                <Select
                  value={deviceConfig.deviceType}
                  onValueChange={(value: any) =>
                    setDeviceConfig({ ...deviceConfig, deviceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">IP Camera</SelectItem>
                    <SelectItem value="access_control">Access Control</SelectItem>
                    <SelectItem value="nvr">NVR (Network Video Recorder)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Device Name</label>
                <Input
                  value={deviceConfig.deviceName || ""}
                  onChange={(e) =>
                    setDeviceConfig({ ...deviceConfig, deviceName: e.target.value })
                  }
                  placeholder="e.g., Main Entrance Camera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={deviceConfig.location || ""}
                  onChange={(e) =>
                    setDeviceConfig({ ...deviceConfig, location: e.target.value })
                  }
                  placeholder="e.g., Front Gate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IP Address</label>
                <Input
                  value={deviceConfig.ipAddress}
                  onChange={(e) =>
                    setDeviceConfig({ ...deviceConfig, ipAddress: e.target.value })
                  }
                  placeholder="192.168.1.200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Port</label>
                <Input
                  type="number"
                  value={deviceConfig.port}
                  onChange={(e) =>
                    setDeviceConfig({
                      ...deviceConfig,
                      port: parseInt(e.target.value),
                    })
                  }
                  placeholder="8000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={deviceConfig.username}
                  onChange={(e) =>
                    setDeviceConfig({ ...deviceConfig, username: e.target.value })
                  }
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={deviceConfig.password}
                  onChange={(e) =>
                    setDeviceConfig({ ...deviceConfig, password: e.target.value })
                  }
                  placeholder="Device password"
                />
              </div>

              <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded">
                💡 Tip: The default port for Hikvision devices is 8000. Ensure your
                device is accessible from your network.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeviceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleTestConnection} disabled={testing}>
                {testing ? "Testing..." : "Test & Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
