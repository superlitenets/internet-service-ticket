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
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import {
  getEmployees as apiGetEmployees,
  createEmployee as apiCreateEmployee,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  type Employee as ApiEmployee,
} from "@/lib/employees-client";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  salary?: number;
  hireDate: string;
  status: "active" | "on_leave" | "inactive";
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    salary: "",
    hireDate: "",
    emergencyContact: "",
    status: "active" as const,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);

  // Load employees from API on mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const dbEmployees = await apiGetEmployees();
        
        const uiEmployees = dbEmployees.map((e: ApiEmployee) => ({
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phone: e.phone,
          position: e.position,
          department: e.department,
          salary: e.salary,
          hireDate: new Date(e.hireDate).toLocaleDateString(),
          status: e.status as "active" | "on_leave" | "inactive",
          emergencyContact: e.emergencyContact,
          createdAt: new Date(e.createdAt).toLocaleString(),
          updatedAt: new Date(e.updatedAt).toLocaleString(),
        }));
        
        setEmployees(uiEmployees);
      } catch (error) {
        console.error("Failed to load employees:", error);
        toast({
          title: "Error",
          description: "Failed to load employees from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "all" || emp.department === filterDepartment;
    const matchesStatus =
      filterStatus === "all" || emp.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        department: employee.department || "",
        position: employee.position || "",
        salary: employee.salary?.toString() || "",
        hireDate: employee.hireDate,
        emergencyContact: employee.emergencyContact || "",
        status: employee.status,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        salary: "",
        hireDate: "",
        emergencyContact: "",
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEmployee) {
        await apiUpdateEmployee(editingEmployee.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department || undefined,
          position: formData.position || undefined,
          salary: formData.salary ? parseInt(formData.salary) : undefined,
          status: formData.status,
          emergencyContact: formData.emergencyContact || undefined,
          hireDate: editingEmployee.hireDate,
          createdAt: editingEmployee.createdAt,
          updatedAt: new Date().toISOString(),
        });

        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editingEmployee.id
              ? {
                  ...e,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  department: formData.department,
                  position: formData.position,
                  salary: formData.salary ? parseInt(formData.salary) : undefined,
                  status: formData.status,
                  emergencyContact: formData.emergencyContact,
                  updatedAt: new Date().toLocaleString(),
                }
              : e,
          ),
        );

        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        const newEmployee = await apiCreateEmployee({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department || undefined,
          position: formData.position || undefined,
          salary: formData.salary ? parseInt(formData.salary) : undefined,
          hireDate: formData.hireDate,
          emergencyContact: formData.emergencyContact || undefined,
        });

        setEmployees((prev) => [
          ...prev,
          {
            id: newEmployee.id,
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            email: newEmployee.email,
            phone: newEmployee.phone,
            position: newEmployee.position,
            department: newEmployee.department,
            salary: newEmployee.salary,
            hireDate: new Date(newEmployee.hireDate).toLocaleDateString(),
            status: newEmployee.status,
            emergencyContact: newEmployee.emergencyContact,
            createdAt: new Date(newEmployee.createdAt).toLocaleString(),
            updatedAt: new Date(newEmployee.updatedAt).toLocaleString(),
          },
        ]);

        toast({
          title: "Success",
          description: "Employee added successfully",
        });
      }
    } catch (error) {
      console.error("Save employee error:", error);
      toast({
        title: "Error",
        description: "Failed to save employee",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(false);
  };

  const handleDelete = async (employeeId: string) => {
    try {
      await apiDeleteEmployee(employeeId);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Delete employee error:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/10 text-accent";
      case "on_leave":
        return "bg-primary/10 text-primary";
      case "inactive":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Employees
            </h1>
            <p className="text-muted-foreground">Manage employee records and information</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus size={18} />
            Add Employee
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept || ""}>
                    {dept || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Employees Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Loading employees from database...</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-muted-foreground" />
                            {employee.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-muted-foreground" />
                            {employee.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {employee.department || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {employee.position || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            variant="secondary"
                            className={getStatusColor(employee.status)}
                          >
                            {employee.status === "on_leave"
                              ? "On Leave"
                              : employee.status.charAt(0).toUpperCase() +
                                employee.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(employee)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteConfirm(employee.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">No employees found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-6 py-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Showing {filteredEmployees.length} of {employees.length} employees
              </p>
            </div>
            </>
          )}
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? "Update employee information"
                  : "Create a new employee record"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Department
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Technical Support"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Position
                  </label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="Senior Technician"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Salary
                  </label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hire Date
                  </label>
                  <Input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) =>
                      setFormData({ ...formData, hireDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Emergency Contact
                </label>
                <Input
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  placeholder="Contact information"
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
                      status: value as "active" | "on_leave" | "inactive",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEmployee ? "Update" : "Create"} Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Employee</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this employee? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
