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
  MessageCircle,
  Edit,
  Trash2,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendSmsToPhone } from "@/lib/sms-client";
import {
  getTemplate,
  renderTemplate,
  getSmsTemplates,
} from "@/lib/sms-templates";
import { getSmsSettings } from "@/lib/sms-settings-storage";

interface Ticket {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation?: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "pending" | "resolved";
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  smsNotificationsSent: number;
}

interface TeamMember {
  name: string;
  phone: string;
}

export default function TicketsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sendingSms, setSendingSms] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    customerEmail: "",
    customerPhone: "",
    customerLocation: "",
    title: "",
    description: "",
    status: "open" as const,
    priority: "medium" as const,
    assignedTo: "Unassigned" as string,
  });

  const [allTickets, setAllTickets] = useState<Ticket[]>([
    {
      id: "TK-001",
      customer: "Acme Corp",
      customerEmail: "contact@acme.com",
      customerPhone: "+1234567890",
      customerLocation: "123 Business Ave, Floor 3, New York, NY 10001",
      title: "Internet connectivity issues on Floor 3",
      description: "Experiencing intermittent disconnections and slow speeds",
      status: "in-progress",
      priority: "high",
      createdAt: "2024-01-15 10:30 AM",
      updatedAt: "2024-01-15 02:45 PM",
      assignedTo: "Mike Johnson",
      smsNotificationsSent: 2,
    },
    {
      id: "TK-002",
      customer: "Tech Startup Inc",
      customerEmail: "support@techstartup.com",
      customerPhone: "+1987654321",
      customerLocation: "456 Innovation Plaza, San Francisco, CA 94102",
      title: "Monthly billing inquiry",
      description: "Questions about invoice charges for January",
      status: "pending",
      priority: "low",
      createdAt: "2024-01-15 09:15 AM",
      updatedAt: "2024-01-15 01:20 PM",
      assignedTo: "Sarah Smith",
      smsNotificationsSent: 1,
    },
    {
      id: "TK-003",
      customer: "Global Industries",
      customerEmail: "info@global-ind.com",
      customerPhone: "+1555555555",
      customerLocation: "789 Commerce Drive, Chicago, IL 60601",
      title: "Router replacement request",
      description: "Old router needs replacement",
      status: "open",
      priority: "medium",
      createdAt: "2024-01-14 03:45 PM",
      updatedAt: "2024-01-14 03:45 PM",
      assignedTo: "Unassigned",
      smsNotificationsSent: 0,
    },
  ]);

  const teamMembers: TeamMember[] = [
    { name: "Mike Johnson", phone: "+1555111111" },
    { name: "Sarah Smith", phone: "+1555222222" },
    { name: "Alex Chen", phone: "+1555333333" },
    { name: "David Brown", phone: "+1555444444" },
  ];

  const getTechnicianPhone = (technicianName: string): string | undefined => {
    return teamMembers.find((t) => t.name === technicianName)?.phone;
  };

  const sendTicketSms = async (
    eventType: "ticket_created" | "ticket_assigned",
    ticket: Ticket,
  ) => {
    try {
      const settings = getSmsSettings();
      if (!settings || !settings.enabled) {
        console.log("SMS notifications disabled or not configured");
        return;
      }

      const technicianPhone = getTechnicianPhone(ticket.assignedTo);

      // Send to customer
      const customerTemplate = getTemplate(eventType, "customer");
      if (customerTemplate) {
        const customerMessage = renderTemplate(customerTemplate, {
          customerName: ticket.customer,
          ticketId: ticket.id,
          title: ticket.title,
          technicianName: ticket.assignedTo,
          technicianPhone: technicianPhone || "N/A",
          status: ticket.status,
          priority: ticket.priority,
        });

        await sendSmsToPhone(ticket.customerPhone, customerMessage);
      }

      // Send to technician if assigned
      if (ticket.assignedTo !== "Unassigned" && technicianPhone) {
        const technicianTemplate = getTemplate(eventType, "technician");
        if (technicianTemplate) {
          const technicianMessage = renderTemplate(technicianTemplate, {
            customerName: ticket.customer,
            customerPhone: ticket.customerPhone,
            customerLocation: ticket.customerLocation || "N/A",
            ticketId: ticket.id,
            title: ticket.title,
            technicianName: ticket.assignedTo,
            technicianPhone: technicianPhone,
            status: ticket.status,
            priority: ticket.priority,
            description: ticket.description,
            updatedBy: "System",
          });

          await sendSmsToPhone(technicianPhone, technicianMessage);
        }
      }
    } catch (error) {
      console.error("Failed to send SMS notifications:", error);
    }
  };

  const filteredTickets = allTickets.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenDialog = (ticket?: Ticket) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        customer: ticket.customer,
        customerEmail: ticket.customerEmail,
        customerPhone: ticket.customerPhone,
        customerLocation: ticket.customerLocation || "",
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
      });
    } else {
      setEditingTicket(null);
      setFormData({
        customer: "",
        customerEmail: "",
        customerPhone: "",
        customerLocation: "",
        title: "",
        description: "",
        status: "open",
        priority: "medium",
        assignedTo: "Unassigned",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.customer || !formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingTicket) {
      setAllTickets((prev) =>
        prev.map((t) =>
          t.id === editingTicket.id
            ? {
                ...t,
                ...formData,
                updatedAt: new Date().toLocaleString(),
              }
            : t,
        ),
      );
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    } else {
      const newTicket: Ticket = {
        id: `TK-${String(allTickets.length + 1).padStart(3, "0")}`,
        ...formData,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        smsNotificationsSent: 0,
      };
      setAllTickets((prev) => [...prev, newTicket]);

      // Send SMS notifications for new ticket
      await sendTicketSms("ticket_created", newTicket);

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
    }

    setDialogOpen(false);
  };

  const handleAssignTicket = async (ticketId: string, assignee: string) => {
    const ticketToUpdate = allTickets.find((t) => t.id === ticketId);
    if (!ticketToUpdate) return;

    const updatedTicket: Ticket = {
      ...ticketToUpdate,
      assignedTo: assignee,
      updatedAt: new Date().toLocaleString(),
    };

    setAllTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? updatedTicket : t)),
    );

    // Send SMS notifications for assignment
    await sendTicketSms("ticket_assigned", updatedTicket);

    toast({
      title: "Success",
      description: `Ticket assigned to ${assignee}`,
    });
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setAllTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus as
                | "open"
                | "in-progress"
                | "pending"
                | "resolved",
              updatedAt: new Date().toLocaleString(),
            }
          : t,
      ),
    );
    toast({
      title: "Success",
      description: `Ticket status updated to ${newStatus}`,
    });
  };

  const handleSendSmsNotification = async (ticket: Ticket) => {
    setSendingSms(true);
    try {
      const settings = getSmsSettings();
      if (!settings) {
        toast({
          title: "Error",
          description: "SMS settings not configured",
          variant: "destructive",
        });
        return;
      }

      const statusTemplate = getTemplate("ticket_status_change", "customer");
      if (!statusTemplate) {
        throw new Error("SMS template not found");
      }

      const message = renderTemplate(statusTemplate, {
        customerName: ticket.customer,
        ticketId: ticket.id,
        status: ticket.status,
      });

      await sendSmsToPhone(ticket.customerPhone, message);

      setAllTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? { ...t, smsNotificationsSent: t.smsNotificationsSent + 1 }
            : t,
        ),
      );

      toast({
        title: "Success",
        description: `SMS notification sent to ${ticket.customerPhone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS notification",
        variant: "destructive",
      });
    } finally {
      setSendingSms(false);
    }
  };

  const handleDelete = (ticketId: string) => {
    setAllTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setDeleteConfirm(null);
    toast({
      title: "Success",
      description: "Ticket deleted successfully",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-accent/10 text-accent border-accent/20";
      case "in-progress":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "open":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-primary/10 text-primary";
      case "low":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 size={16} />;
      case "in-progress":
        return <Clock size={16} />;
      case "open":
        return <AlertCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "in-progress"
      ? "In Progress"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Tickets
            </h1>
            <p className="text-muted-foreground">
              Manage and track all customer support tickets
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus size={18} />
            Create Ticket
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by ID, customer, or title..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tickets Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    SMS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-primary whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                        {ticket.customer}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) =>
                            handleStatusChange(ticket.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          variant="secondary"
                          className={getPriorityColor(ticket.priority)}
                        >
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Select
                          value={ticket.assignedTo}
                          onValueChange={(value) =>
                            handleAssignTicket(ticket.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unassigned">
                              Unassigned
                            </SelectItem>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.name} value={member.name}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ticket.smsNotificationsSent > 0 ? (
                          <div className="flex items-center gap-1 text-accent">
                            <MessageCircle size={16} />
                            {ticket.smsNotificationsSent}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(ticket)}
                            title="Edit ticket"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendSmsNotification(ticket)}
                            disabled={sendingSms}
                            title="Send SMS notification"
                          >
                            <Send size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(ticket.id)}
                            title="Delete ticket"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">No tickets found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTickets.length} of {allTickets.length} tickets
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? "Edit Ticket" : "Create New Ticket"}
              </DialogTitle>
              <DialogDescription>
                {editingTicket
                  ? "Update ticket information"
                  : "Create a new support ticket"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Customer Name *
                  </label>
                  <Input
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerEmail: e.target.value,
                      })
                    }
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerPhone: e.target.value,
                    })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location / Address
                </label>
                <Input
                  value={formData.customerLocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerLocation: e.target.value,
                    })
                  }
                  placeholder="e.g., 123 Main St, Suite 200, New York, NY 10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ticket Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Internet connectivity issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the issue in detail..."
                  className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                          | "open"
                          | "in-progress"
                          | "pending"
                          | "resolved",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as "high" | "medium" | "low",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assign To
                  </label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedTo: value })
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingTicket ? "Update" : "Create"} Ticket
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
              <DialogTitle>Delete Ticket</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this ticket? This action cannot
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
