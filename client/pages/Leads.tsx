import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ArrowRightLeft,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  convertLeadToTicket,
  type Lead,
} from "@/lib/leads-client";

interface CreateLeadForm {
  customerName: string;
  phone: string;
  email: string;
  location: string;
  package: string;
  agreedInstallAmount: string;
  notes: string;
}

interface ConvertForm {
  subject: string;
  description: string;
  priority: string;
  category: string;
  assignedTo: string;
}

interface TeamMember {
  name: string;
  phone: string;
}

export default function Leads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState<CreateLeadForm>({
    customerName: "",
    phone: "",
    email: "",
    location: "",
    package: "",
    agreedInstallAmount: "",
    notes: "",
  });

  const [convertForm, setConvertForm] = useState<ConvertForm>({
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
    assignedTo: "Unassigned",
  });

  const teamMembers: TeamMember[] = [
    { name: "Mike Johnson", phone: "+1555111111" },
    { name: "Sarah Smith", phone: "+1555222222" },
    { name: "Alex Chen", phone: "+1555333333" },
    { name: "David Brown", phone: "+1555444444" },
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { leads: loadedLeads } = await getLeads();
      setLeads(loadedLeads);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customerName.toLowerCase().includes(search) ||
          lead.phone.includes(search) ||
          lead.email?.toLowerCase().includes(search) ||
          lead.location.toLowerCase().includes(search),
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setFilteredLeads(filtered);
  };

  const handleCreateLead = async () => {
    if (
      !formData.customerName ||
      !formData.phone ||
      !formData.location ||
      !formData.package ||
      !formData.agreedInstallAmount
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (editingLead) {
        await updateLead(editingLead.id, {
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || undefined,
          location: formData.location,
          package: formData.package,
          agreedInstallAmount: parseFloat(formData.agreedInstallAmount),
          notes: formData.notes || undefined,
        });
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        await createLead({
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || undefined,
          location: formData.location,
          package: formData.package,
          agreedInstallAmount: parseFloat(formData.agreedInstallAmount),
          notes: formData.notes || undefined,
        });
        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      setFormData({
        customerName: "",
        phone: "",
        email: "",
        location: "",
        package: "",
        agreedInstallAmount: "",
        notes: "",
      });
      setEditingLead(null);
      setShowCreateDialog(false);
      await loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email || "",
      location: lead.location,
      package: lead.package,
      agreedInstallAmount: lead.agreedInstallAmount.toString(),
      notes: lead.notes || "",
    });
    setShowCreateDialog(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      setLoading(true);
      await deleteLead(id);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      await loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;

    if (!convertForm.subject || !convertForm.description) {
      toast({
        title: "Error",
        description: "Please fill in subject and description",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await convertLeadToTicket(
        selectedLead.id,
        convertForm.subject,
        convertForm.description,
        convertForm.priority,
        convertForm.category,
        convertForm.assignedTo,
      );

      if (result && result.ticket) {
        const ticket = result.ticket;
        try {
          const existingTickets = localStorage.getItem("tickets_data");
          const ticketsArray = existingTickets
            ? JSON.parse(existingTickets)
            : [];
          ticketsArray.push(ticket);
          localStorage.setItem("tickets_data", JSON.stringify(ticketsArray));
        } catch (storageError) {
          console.warn("Failed to save ticket to localStorage:", storageError);
        }
      }

      toast({
        title: "Success",
        description: "Lead converted to ticket successfully",
      });

      setConvertForm({
        subject: "",
        description: "",
        priority: "medium",
        category: "general",
        assignedTo: "Unassigned",
      });
      setSelectedLead(null);
      setShowConvertDialog(false);
      await loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to convert lead to ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-purple-100 text-purple-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle size={16} />;
      case "contacted":
        return <Clock size={16} />;
      case "qualified":
        return <CheckCircle2 size={16} />;
      case "converted":
        return <CheckCircle2 size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sales Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage prospective clients and convert them to tickets
          </p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Search by name, phone, email, or location..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter size={16} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingLead(null);
              setFormData({
                customerName: "",
                phone: "",
                email: "",
                location: "",
                package: "",
                agreedInstallAmount: "",
                notes: "",
              });
              setShowCreateDialog(true);
            }}
            className="gap-2"
          >
            <Plus size={20} />
            New Lead
          </Button>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Amount (KES)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No leads found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {lead.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Phone size={14} />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2">
                              <Mail size={14} />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          {lead.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Package size={14} />
                          {lead.package}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} />
                          {lead.agreedInstallAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={getStatusColor(lead.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(lead.status)}
                            {lead.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {lead.status !== "converted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setConvertForm({
                                  subject: `Service Installation - ${lead.customerName}`,
                                  description: `Customer: ${lead.customerName}\nPhone: ${lead.phone}\nLocation: ${lead.location}\nPackage: ${lead.package}`,
                                  priority: "medium",
                                  category: "general",
                                  assignedTo: "Unassigned",
                                });
                                setShowConvertDialog(true);
                              }}
                              className="gap-2"
                            >
                              <ArrowRightLeft size={16} />
                              Convert
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLead(lead)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLead ? "Edit Lead" : "Create New Lead"}
              </DialogTitle>
              <DialogDescription>
                {editingLead
                  ? "Update the lead information below"
                  : "Add a new prospective client"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Name *
                </label>
                <Input
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="e.g., 0722123456"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g., john@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location *
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Nairobi, Karen"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Package *
                </label>
                <Input
                  value={formData.package}
                  onChange={(e) =>
                    setFormData({ ...formData, package: e.target.value })
                  }
                  placeholder="e.g., Premium 20Mbps"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agreed Installation Amount (KES) *
                </label>
                <Input
                  type="number"
                  value={formData.agreedInstallAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreedInstallAmount: e.target.value,
                    })
                  }
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any notes about this lead..."
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLead} disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingLead
                    ? "Update Lead"
                    : "Create Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Convert Lead to Ticket</DialogTitle>
              <DialogDescription>
                Convert {selectedLead?.customerName} to a support ticket
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ticket Subject *
                </label>
                <Input
                  value={convertForm.subject}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, subject: e.target.value })
                  }
                  placeholder="e.g., Service Installation"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  value={convertForm.description}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add ticket description..."
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <Select
                    value={convertForm.priority}
                    onValueChange={(value) =>
                      setConvertForm({ ...convertForm, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <Select
                    value={convertForm.category}
                    onValueChange={(value) =>
                      setConvertForm({ ...convertForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign To
                  </label>
                  <Select
                    value={convertForm.assignedTo}
                    onValueChange={(value) =>
                      setConvertForm({ ...convertForm, assignedTo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.name} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConvertDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConvertLead} disabled={loading}>
                {loading ? "Converting..." : "Convert to Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
