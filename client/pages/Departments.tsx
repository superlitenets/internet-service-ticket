import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSaveNotification } from "@/lib/save-notification";

interface Department {
  id: string;
  name: string;
  description?: string;
  manager?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamGroup {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  manager?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"departments" | "teams">(
    "departments",
  );

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchDept, setSearchDept] = useState("");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    manager: "",
  });

  // Team Groups state
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [searchTeam, setSearchTeam] = useState("");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamGroup | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
    departmentId: "",
    manager: "",
  });

  // Load departments and teams on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
      }

      // Load team groups
      const teamRes = await fetch("/api/team-groups");
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamGroups(teamData.teamGroups || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load departments and teams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Department handlers
  const handleOpenDeptDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptFormData({
        name: dept.name,
        description: dept.description || "",
        manager: dept.manager || "",
      });
    } else {
      setEditingDept(null);
      setDeptFormData({ name: "", description: "", manager: "" });
    }
    setDeptDialogOpen(true);
  };

  const handleSaveDept = async () => {
    if (!deptFormData.name) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDept) {
        console.log("[Departments] Updating department:", editingDept.id, deptFormData);
        const response = await fetch(`/api/departments/${editingDept.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deptFormData),
        });

        console.log("[Departments] Update response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Departments] Update error response:", errorText);
          throw new Error(`Failed to update department: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("[Departments] Updated successfully:", result);
        setDepartments((prev) =>
          prev.map((d) => (d.id === editingDept.id ? result.department : d)),
        );

        toast(getSaveNotification({ itemName: `Department "${deptFormData.name}"`, action: "updated" }));
      } else {
        console.log("[Departments] Creating department with data:", deptFormData);
        const response = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deptFormData),
        });

        console.log("[Departments] Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Departments] Error response:", errorText);
          throw new Error(`Failed to create department: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("[Departments] Created successfully:", result);
        setDepartments((prev) => [...prev, result.department]);

        toast(getSaveNotification({ itemName: `Department "${result.department.name}"`, action: "created" }));
      }

      setDeptDialogOpen(false);
    } catch (error) {
      console.error("Save department error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save department",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete department");

      const deptName = departments.find((d) => d.id === id)?.name || "Department";
      setDepartments((prev) => prev.filter((d) => d.id !== id));

      toast(getSaveNotification({ itemName: `"${deptName}"`, action: "deleted" }));
    } catch (error) {
      console.error("Delete department error:", error);
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
    }
  };

  // Team handlers
  const handleOpenTeamDialog = (team?: TeamGroup) => {
    if (team) {
      setEditingTeam(team);
      setTeamFormData({
        name: team.name,
        description: team.description || "",
        departmentId: team.departmentId || "",
        manager: team.manager || "",
      });
    } else {
      setEditingTeam(null);
      setTeamFormData({
        name: "",
        description: "",
        departmentId: "",
        manager: "",
      });
    }
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamFormData.name) {
      toast({
        title: "Error",
        description: "Team group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTeam) {
        const response = await fetch(`/api/team-groups/${editingTeam.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teamFormData),
        });

        if (!response.ok) throw new Error("Failed to update team group");

        const result = await response.json();
        setTeamGroups((prev) =>
          prev.map((t) => (t.id === editingTeam.id ? result.teamGroup : t)),
        );

        toast({
          title: "Success",
          description: "Team group updated successfully",
        });
      } else {
        const response = await fetch("/api/team-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(teamFormData),
        });

        if (!response.ok) throw new Error("Failed to create team group");

        const result = await response.json();
        setTeamGroups((prev) => [...prev, result.teamGroup]);

        toast({
          title: "Success",
          description: "Team group created successfully",
        });
      }

      setTeamDialogOpen(false);
    } catch (error) {
      console.error("Save team error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save team group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/team-groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete team group");

      setTeamGroups((prev) => prev.filter((t) => t.id !== id));

      toast({
        title: "Success",
        description: "Team group deleted successfully",
      });
    } catch (error) {
      console.error("Delete team error:", error);
      toast({
        title: "Error",
        description: "Failed to delete team group",
        variant: "destructive",
      });
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchDept.toLowerCase()),
  );

  const filteredTeams = teamGroups.filter((t) =>
    t.name.toLowerCase().includes(searchTeam.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Organization Management
          </h1>
          <p className="text-muted-foreground">
            Manage departments and team groups for your organization
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "departments"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "teams"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Team Groups
          </button>
        </div>

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            {/* Filters and Add Button */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search departments..."
                    className="pl-10"
                    value={searchDept}
                    onChange={(e) => setSearchDept(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => handleOpenDeptDialog()}
                  className="gap-2 w-full md:w-auto"
                >
                  <Plus size={18} />
                  New Department
                </Button>
              </div>
            </Card>

            {/* Departments List */}
            <div className="grid gap-4">
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Loading departments...
                  </p>
                </Card>
              ) : filteredDepts.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No departments found</p>
                </Card>
              ) : (
                filteredDepts.map((dept) => (
                  <Card
                    key={dept.id}
                    className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">
                          {dept.name}
                        </h3>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {dept.description}
                          </p>
                        )}
                        {dept.manager && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Manager: {dept.manager}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDeptDialog(dept)}
                          className="gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDept(dept.id)}
                          className="gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Team Groups Tab */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            {/* Filters and Add Button */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="relative flex-1 md:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search team groups..."
                    className="pl-10"
                    value={searchTeam}
                    onChange={(e) => setSearchTeam(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => handleOpenTeamDialog()}
                  className="gap-2 w-full md:w-auto"
                >
                  <Plus size={18} />
                  New Team Group
                </Button>
              </div>
            </Card>

            {/* Team Groups List */}
            <div className="grid gap-4">
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Loading team groups...
                  </p>
                </Card>
              ) : filteredTeams.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No team groups found</p>
                </Card>
              ) : (
                filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">
                          {team.name}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {team.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {team.departmentId
                              ? "Has Department"
                              : "No Department"}
                          </span>
                          {team.manager && <span>Lead: {team.manager}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTeamDialog(team)}
                          className="gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDept
                ? "Update department information"
                : "Create a new department for your organization"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Department Name *
              </label>
              <Input
                value={deptFormData.name}
                onChange={(e) =>
                  setDeptFormData({ ...deptFormData, name: e.target.value })
                }
                placeholder="e.g., Sales, Engineering, Support"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={deptFormData.description}
                onChange={(e) =>
                  setDeptFormData({
                    ...deptFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the department..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Manager ID
              </label>
              <Input
                value={deptFormData.manager}
                onChange={(e) =>
                  setDeptFormData({ ...deptFormData, manager: e.target.value })
                }
                placeholder="Employee ID of department manager"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDept}>
              {editingDept ? "Update" : "Create"} Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Group Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Team Group" : "Add New Team Group"}
            </DialogTitle>
            <DialogDescription>
              {editingTeam
                ? "Update team group information"
                : "Create a new team group in your organization"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Team Group Name *
              </label>
              <Input
                value={teamFormData.name}
                onChange={(e) =>
                  setTeamFormData({ ...teamFormData, name: e.target.value })
                }
                placeholder="e.g., Frontend Team, Support Tier 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={teamFormData.description}
                onChange={(e) =>
                  setTeamFormData({
                    ...teamFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the team..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Department
              </label>
              <select
                value={teamFormData.departmentId}
                onChange={(e) =>
                  setTeamFormData({
                    ...teamFormData,
                    departmentId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="">Select a department (optional)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Team Lead ID
              </label>
              <Input
                value={teamFormData.manager}
                onChange={(e) =>
                  setTeamFormData({ ...teamFormData, manager: e.target.value })
                }
                placeholder="Employee ID of team lead"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTeam}>
              {editingTeam ? "Update" : "Create"} Team Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
