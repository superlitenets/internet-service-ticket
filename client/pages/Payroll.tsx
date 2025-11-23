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
  DollarSign,
  Plus,
  Edit,
  Download,
  Search,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";
import type { PayrollRecord, AttendanceRecord } from "@shared/api";
import { getDeductionSettings } from "@/lib/deduction-settings-storage";
import {
  calculateMonthlyDeductions,
  getDeductionSummary,
} from "@/lib/deduction-calculator";

export default function PayrollPage() {
  const { toast } = useToast();

  // Mock attendance data for deduction calculations
  const mockAttendanceData: AttendanceRecord[] = [
    {
      id: "ATT-001",
      employeeId: "EMP-001",
      employeeName: "John Smith",
      checkInTime: "09:00 AM",
      checkOutTime: "05:45 PM",
      date: "2024-01-10",
      status: "late",
      biometricSource: "zkteco40",
      duration: 555,
      createdAt: "2024-01-10 09:00 AM",
      updatedAt: "2024-01-10 05:45 PM",
    },
    {
      id: "ATT-002",
      employeeId: "EMP-001",
      employeeName: "John Smith",
      checkInTime: "08:50 AM",
      checkOutTime: "06:00 PM",
      date: "2024-01-15",
      status: "present",
      biometricSource: "zkteco40",
      duration: 550,
      createdAt: "2024-01-15 08:50 AM",
      updatedAt: "2024-01-15 06:00 PM",
    },
    {
      id: "ATT-003",
      employeeId: "EMP-002",
      employeeName: "Maria Garcia",
      checkInTime: "09:30 AM",
      checkOutTime: "06:00 PM",
      date: "2024-01-20",
      status: "late",
      biometricSource: "zkteco40",
      duration: 510,
      createdAt: "2024-01-20 09:30 AM",
      updatedAt: "2024-01-20 06:00 PM",
    },
  ];

  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([
    {
      id: "PAY-001",
      employeeId: "EMP-001",
      employeeName: "John Smith",
      month: "January",
      year: 2024,
      baseSalary: 45000,
      bonus: 2000,
      deductions: 5000,
      netSalary: 42000,
      status: "paid",
      paymentDate: "2024-01-31",
      createdAt: "2024-01-01 09:00 AM",
      updatedAt: "2024-01-31 02:45 PM",
    },
    {
      id: "PAY-002",
      employeeId: "EMP-002",
      employeeName: "Maria Garcia",
      month: "January",
      year: 2024,
      baseSalary: 38000,
      bonus: 1500,
      deductions: 4200,
      netSalary: 35300,
      status: "approved",
      paymentDate: "2024-01-31",
      createdAt: "2024-01-01 09:00 AM",
      updatedAt: "2024-01-15 10:30 AM",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "draft" | "approved" | "paid" | "pending"
  >("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [deductionSettings] = useState(() => getDeductionSettings());
  const [monthlyDeductions] = useState(() =>
    calculateMonthlyDeductions(
      mockAttendanceData,
      allRecords,
      deductionSettings,
    ),
  );

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    month: "January",
    year: 2024,
    baseSalary: 0,
    bonus: 0,
    deductions: 0,
  });

  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;
    const matchesMonth =
      filterMonth === "all" || `${record.month}-${record.year}` === filterMonth;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getMonthOptions = () => {
    const options = new Set<string>();
    allRecords.forEach((record) => {
      options.add(`${record.month}-${record.year}`);
    });
    return Array.from(options).sort().reverse();
  };

  const getTotalPayroll = () => {
    return filteredRecords.reduce((sum, record) => {
      let deduction = 0;
      const deductionDetail = monthlyDeductions.get(record.employeeId);
      if (deductionDetail) {
        deduction = deductionDetail.deductionAmount;
      }
      return sum + (record.netSalary - deduction);
    }, 0);
  };

  const getEmployeeDeduction = (employeeId: string): number => {
    const deductionDetail = monthlyDeductions.get(employeeId);
    return deductionDetail ? deductionDetail.deductionAmount : 0;
  };

  const handleOpenDialog = (record?: PayrollRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        month: record.month,
        year: record.year,
        baseSalary: record.baseSalary,
        bonus: record.bonus,
        deductions: record.deductions,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        employeeId: "",
        employeeName: "",
        month: "January",
        year: 2024,
        baseSalary: 0,
        bonus: 0,
        deductions: 0,
      });
    }
    setDialogOpen(true);
  };

  const calculateNetSalary = () => {
    return formData.baseSalary + formData.bonus - formData.deductions;
  };

  const handleSaveRecord = () => {
    if (!formData.employeeId || !formData.month || formData.baseSalary === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const netSalary = calculateNetSalary();

    if (editingRecord) {
      setAllRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                ...formData,
                netSalary,
                updatedAt: new Date().toLocaleString(),
              }
            : r,
        ),
      );
      toast({
        title: "Success",
        description: "Payroll record updated",
      });
    } else {
      const newRecord: PayrollRecord = {
        id: `PAY-${String(allRecords.length + 1).padStart(3, "0")}`,
        ...formData,
        netSalary,
        status: "draft",
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };
      setAllRecords((prev) => [...prev, newRecord]);
      toast({
        title: "Success",
        description: "Payroll record created",
      });
    }

    setDialogOpen(false);
  };

  const handleApprove = (id: string) => {
    setAllRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              updatedAt: new Date().toLocaleString(),
            }
          : r,
      ),
    );
    toast({
      title: "Success",
      description: "Payroll approved",
    });
  };

  const handleMarkPaid = (id: string) => {
    setAllRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "paid" as const,
              paymentDate: new Date().toISOString().split("T")[0],
              updatedAt: new Date().toLocaleString(),
            }
          : r,
      ),
    );
    toast({
      title: "Success",
      description: "Marked as paid",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "approved":
        return "secondary";
      case "draft":
        return "outline";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payroll</h1>
            <p className="text-muted-foreground mt-1">
              Manage employee salaries and payroll records
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus size={16} />
            Create Payroll
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Payroll</p>
            <p className="text-2xl font-bold">
              ${getTotalPayroll().toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Records</p>
            <p className="text-2xl font-bold">{filteredRecords.length}</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {allRecords.filter((r) => r.status === "paid").length}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {allRecords.filter((r) => r.status === "draft").length}
            </p>
          </Card>
          {deductionSettings.enabled && (
            <Card className="p-4 border-0 shadow-sm bg-orange-50">
              <p className="text-sm text-muted-foreground mb-1">Late Deductions</p>
              <p className="text-2xl font-bold text-orange-600">
                $
                {Array.from(monthlyDeductions.values())
                  .reduce((sum, d) => sum + d.deductionAmount, 0)
                  .toLocaleString()}
              </p>
            </Card>
          )}
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
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(
                  value as "all" | "draft" | "approved" | "paid" | "pending",
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-muted-foreground">
                  No payroll records found
                </p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {record.employeeName}
                        </h3>
                        <Badge variant={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                        <Badge variant="outline">
                          {record.month} {record.year}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-6 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-muted-foreground">Base Salary</p>
                          <p className="font-semibold">
                            ${record.baseSalary.toLocaleString()}
                          </p>
                        </div>
                        {record.bonus > 0 && (
                          <div>
                            <p className="text-muted-foreground">Bonus</p>
                            <p className="font-semibold text-green-600">
                              +${record.bonus.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {record.deductions > 0 && (
                          <div>
                            <p className="text-muted-foreground">Standard Ded.</p>
                            <p className="font-semibold text-red-600">
                              -${record.deductions.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {getEmployeeDeduction(record.employeeId) > 0 && (
                          <div>
                            <p className="text-muted-foreground">Late Ded.</p>
                            <p className="font-semibold text-orange-600">
                              -${getEmployeeDeduction(record.employeeId).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Net Salary</p>
                          <p className="font-semibold text-lg">
                            ${(record.netSalary - getEmployeeDeduction(record.employeeId)).toLocaleString()}
                          </p>
                        </div>
                        {record.paymentDate && (
                          <div>
                            <p className="text-muted-foreground">Paid On</p>
                            <p className="font-semibold">
                              {record.paymentDate}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {record.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(record.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {record.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(record.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(record)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Payroll Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Edit Payroll" : "Create Payroll"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord
                  ? "Update payroll information"
                  : "Create a new payroll record"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    Month
                  </label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) =>
                      setFormData({ ...formData, month: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Year
                  </label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Base Salary
                  </label>
                  <Input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSalary: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bonus
                  </label>
                  <Input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bonus: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Deductions
                </label>
                <Input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deductions: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">
                    Net Salary:
                  </span>
                  <span className="text-2xl font-bold text-blue-900">
                    ${calculateNetSalary().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRecord}>
                {editingRecord ? "Update" : "Create"} Payroll
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
