import { useState, useEffect } from "react";
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
  Clock,
  Plus,
  Search,
  Calendar,
  LogIn,
  LogOut,
  Smartphone,
  Zap,
  AlertCircle,
} from "lucide-react";
import type { AttendanceRecord } from "@shared/api";
import {
  createAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "@/lib/attendance-client";

interface ExtendedAttendanceRecord extends AttendanceRecord {
  employeeName?: string;
  biometricSource?: string;
  duration?: number;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<ExtendedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    checkInTime: new Date().toLocaleTimeString(),
    checkOutTime: "",
    status: "present" as const,
    biometricSource: "manual" as const,
  });

  const [zKtecoConfig, setZKtecoConfig] = useState({
    ipAddress: "192.168.1.100",
    port: 4370,
    username: "admin",
    password: "",
  });

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        const records = await getAttendanceRecords();
        const mappedRecords: ExtendedAttendanceRecord[] = records.map(
          (record: any) => ({
            ...record,
            employeeName: record.employeeName || "Unknown",
            biometricSource: "manual",
          }),
        );
        setAllRecords(mappedRecords);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load attendance records",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = record.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  const handleSyncZKteco = async () => {
    setSyncing(true);
    try {
      toast({
        title: "Info",
        description: "ZKteco sync feature coming soon",
      });
      setSyncDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to sync ZKteco device",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      toast({
        title: "Info",
        description: "ZKteco test feature coming soon",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to ZKteco device",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAddRecord = async () => {
    if (!formData.employeeId || !formData.employeeName) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    try {
      const newRecord = await createAttendanceRecord({
        employeeId: formData.employeeId,
        date: selectedDate,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        status: formData.status,
        notes: undefined,
      });

      const mappedRecord: ExtendedAttendanceRecord = {
        ...newRecord,
        employeeName: formData.employeeName,
        biometricSource: "manual",
      };

      setAllRecords((prev) => [...prev, mappedRecord]);
      toast({
        title: "Success",
        description: "Attendance record added",
      });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add attendance record",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "half-day":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBiometricIcon = (source?: string) => {
    switch (source) {
      case "zkteco40":
        return <Zap size={14} className="text-blue-600" />;
      case "mobile":
        return <Smartphone size={14} className="text-green-600" />;
      default:
        return <AlertCircle size={14} className="text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-1">
              Manage employee attendance and sync with ZKteco40 devices
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSyncDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Zap size={16} />
              Sync ZKteco40
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus size={16} />
              Add Record
            </Button>
          </div>
        </div>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Clock
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-muted-foreground">
                  No attendance records found
                </p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {record.employeeName}
                        </h3>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getBiometricIcon(record.biometricSource)}
                          <span className="text-xs text-muted-foreground">
                            {record.biometricSource}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <LogIn size={14} />
                          {record.checkInTime}
                        </div>
                        {record.checkOutTime && (
                          <div className="flex items-center gap-2">
                            <LogOut size={14} />
                            {record.checkOutTime}
                          </div>
                        )}
                        {record.duration && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            {Math.floor(record.duration / 60)}h{" "}
                            {record.duration % 60}m
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Sync ZKteco Dialog */}
        <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sync ZKteco40 Device</DialogTitle>
              <DialogDescription>
                Configure and sync attendance data from your ZKteco40 biometric
                device
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Device IP Address
                  </label>
                  <Input
                    value={zKtecoConfig.ipAddress}
                    onChange={(e) =>
                      setZKtecoConfig({
                        ...zKtecoConfig,
                        ipAddress: e.target.value,
                      })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Port
                  </label>
                  <Input
                    type="number"
                    value={zKtecoConfig.port}
                    onChange={(e) =>
                      setZKtecoConfig({
                        ...zKtecoConfig,
                        port: parseInt(e.target.value),
                      })
                    }
                    placeholder="4370"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Username
                  </label>
                  <Input
                    value={zKtecoConfig.username}
                    onChange={(e) =>
                      setZKtecoConfig({
                        ...zKtecoConfig,
                        username: e.target.value,
                      })
                    }
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={zKtecoConfig.password}
                    onChange={(e) =>
                      setZKtecoConfig({
                        ...zKtecoConfig,
                        password: e.target.value,
                      })
                    }
                    placeholder="Device password"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Tip: The default port for ZKteco devices is 4370. Ensure
                  your device is accessible from your network.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSyncDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button onClick={handleSyncZKteco} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Record Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Attendance Record</DialogTitle>
              <DialogDescription>
                Manually add attendance record for an employee
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Employee
                </label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => {
                    const name = value.includes("-")
                      ? value.split("-")[1]
                      : "Unknown";
                    setFormData({
                      ...formData,
                      employeeId: value,
                      employeeName: name,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMP-001-John Smith">
                      John Smith
                    </SelectItem>
                    <SelectItem value="EMP-002-Maria Garcia">
                      Maria Garcia
                    </SelectItem>
                    <SelectItem value="EMP-003-Alex Johnson">
                      Alex Johnson
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Check In Time
                </label>
                <Input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) =>
                    setFormData({ ...formData, checkInTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Check Out Time (Optional)
                </label>
                <Input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) =>
                    setFormData({ ...formData, checkOutTime: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as
                        | "present"
                        | "absent"
                        | "late"
                        | "half-day",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRecord}>Add Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
