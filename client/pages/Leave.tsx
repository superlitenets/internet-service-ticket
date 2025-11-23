import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  Plus,
  Check,
  X,
  Search,
  Clock,
  User,
  FileText,
} from "lucide-react";
import type { LeaveRequest } from "@shared/api";

export default function LeavePage() {
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([
    {
      id: "LEAVE-001",
      employeeId: "EMP-001",
      employeeName: "John Smith",
      leaveType: "annual",
      startDate: "2024-02-01",
      endDate: "2024-02-05",
      duration: 5,
      reason: "Summer vacation",
      status: "approved",
      approvedBy: "Manager",
      approvalDate: "2024-01-20",
      createdAt: "2024-01-15 10:30 AM",
      updatedAt: "2024-01-20 02:45 PM",
    },
    {
      id: "LEAVE-002",
      employeeId: "EMP-002",
      employeeName: "Maria Garcia",
      leaveType: "sick",
      startDate: "2024-01-16",
      endDate: "2024-01-17",
      duration: 2,
      reason: "Medical appointment",
      status: "pending",
      createdAt: "2024-01-15 02:00 PM",
      updatedAt: "2024-01-15 02:00 PM",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    leaveType: "annual" as const,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [approvalData, setApprovalData] = useState({
    approvedBy: "",
    comment: "",
  });

  const filteredRequests = allRequests.filter((req) => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleOpenDialog = (request?: LeaveRequest) => {
    if (request) {
      setEditingRequest(request);
      setFormData({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
      });
    } else {
      setEditingRequest(null);
      setFormData({
        employeeId: "",
        employeeName: "",
        leaveType: "annual",
        startDate: "",
        endDate: "",
        reason: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSaveRequest = () => {
    if (
      !formData.employeeId ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.reason
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration(formData.startDate, formData.endDate);

    if (editingRequest) {
      setAllRequests((prev) =>
        prev.map((r) =>
          r.id === editingRequest.id
            ? {
                ...r,
                ...formData,
                duration,
                updatedAt: new Date().toLocaleString(),
              }
            : r,
        ),
      );
      toast({
        title: "Success",
        description: "Leave request updated",
      });
    } else {
      const newRequest: LeaveRequest = {
        id: `LEAVE-${String(allRequests.length + 1).padStart(3, "0")}`,
        ...formData,
        duration,
        status: "pending",
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };
      setAllRequests((prev) => [...prev, newRequest]);
      toast({
        title: "Success",
        description: "Leave request submitted",
      });
    }

    setDialogOpen(false);
  };

  const handleApprove = (id: string) => {
    setAllRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              approvedBy: "Manager",
              approvalDate: new Date().toISOString().split("T")[0],
              updatedAt: new Date().toLocaleString(),
            }
          : r,
      ),
    );
    toast({
      title: "Success",
      description: "Leave request approved",
    });
  };

  const handleReject = (id: string) => {
    setAllRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "rejected" as const,
              updatedAt: new Date().toLocaleString(),
            }
          : r,
      ),
    );
    toast({
      title: "Success",
      description: "Leave request rejected",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: "Annual Leave",
      sick: "Sick Leave",
      maternity: "Maternity Leave",
      unpaid: "Unpaid Leave",
      compassionate: "Compassionate Leave",
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Leave Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage employee leave requests and approvals
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus size={16} />
            Request Leave
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
            <p className="text-2xl font-bold">{allRequests.length}</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {allRequests.filter((r) => r.status === "pending").length}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {allRequests.filter((r) => r.status === "approved").length}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {allRequests.filter((r) => r.status === "rejected").length}
            </p>
          </Card>
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
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(
                  value as "all" | "pending" | "approved" | "rejected",
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-muted-foreground">No leave requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {request.employeeName}
                        </h3>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline">
                          {getLeaveTypeLabel(request.leaveType)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {request.reason}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {request.startDate} to {request.endDate}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {request.duration} days
                        </div>
                        {request.approvedBy && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            Approved by {request.approvedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check size={14} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600"
                          onClick={() => handleReject(request.id)}
                        >
                          <X size={14} />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Leave Request Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? "Edit Leave Request" : "Request Leave"}
              </DialogTitle>
              <DialogDescription>
                {editingRequest
                  ? "Update your leave request"
                  : "Submit a new leave request"}
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
                    Leave Type
                  </label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        leaveType: value as
                          | "annual"
                          | "sick"
                          | "maternity"
                          | "unpaid"
                          | "compassionate",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="compassionate">
                        Compassionate Leave
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                    }}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Duration:{" "}
                    {calculateDuration(formData.startDate, formData.endDate)}{" "}
                    days
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason for Leave
                </label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Please provide a reason for your leave request"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRequest}>
                {editingRequest ? "Update" : "Submit"} Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
