import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import TicketDetail from "@/components/TicketDetail";
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
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCustomers, createCustomer as apiCreateCustomer } from "@/lib/customers-client";
import { getEmployees } from "@/lib/employees-client";
import { sendSmsToPhone } from "@/lib/sms-client";
import {
  getTemplate,
  renderTemplate,
  getSmsTemplates,
} from "@/lib/sms-templates";
import { getSmsSettings } from "@/lib/sms-settings-storage";
import {
  sendWhatsAppUnifiedToPhone,
  sendWhatsAppUnifiedBatch,
} from "@/lib/whatsapp-unified-client";
import { getWhatsAppConfig } from "@/lib/whatsapp-settings-storage";
import {
  createTicket as apiCreateTicket,
  getTickets as apiGetTickets,
  updateTicket as apiUpdateTicket,
  deleteTicket as apiDeleteTicket,
  type Ticket as ApiTicket,
} from "@/lib/tickets-client";

interface Reply {
  id: string;
  author: string;
  authorRole: "customer" | "support" | "admin";
  message: string;
  timestamp: string;
}

interface Ticket {
  id: string;
  customerId: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation?: string;
  apartment?: string;
  roomNumber?: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "pending" | "resolved";
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  smsNotificationsSent: number;
  replies?: Reply[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Employee {
  id: string;
  name: string;
  email?: string;
}

export default function TicketsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sendingSms, setSendingSms] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    description: "",
    status: "open" as const,
    priority: "medium" as const,
    assignedTo: "" as string,
  });

  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const getTechnicianPhone = (technicianId: string): string | undefined => {
    return employees.find((e) => e.id === technicianId)?.email;
  };

  const sendTicketSms = async (
    eventType: "ticket_created" | "ticket_assigned",
    ticket: Ticket,
  ) => {
    try {
      const smsSettings = getSmsSettings();
      const whatsappSettings = getWhatsAppConfig();

      if (
        (!smsSettings || !smsSettings.enabled) &&
        (!whatsappSettings || !whatsappSettings.enabled)
      ) {
        console.log("No messaging service enabled");
        return;
      }

      const technicianPhone = getTechnicianPhone(ticket.assignedTo);

      // Prepare message variables
      const messageVars = {
        customerName: ticket.customer,
        customerPhone: ticket.customerPhone,
        customerLocation: ticket.customerLocation || "N/A",
        ticketId: ticket.id,
        title: ticket.title,
        technicianName: ticket.assignedTo,
        technicianPhone: technicianPhone || "N/A",
        status: ticket.status,
        priority: ticket.priority,
        description: ticket.description,
        updatedBy: "System",
      };

      // Send to customer via SMS
      if (smsSettings?.enabled) {
        const customerTemplate = getTemplate(eventType, "customer");
        if (customerTemplate) {
          const customerMessage = renderTemplate(customerTemplate, messageVars);
          await sendSmsToPhone(ticket.customerPhone, customerMessage);
        }
      }

      // Send to customer via WhatsApp (unified with Business API + Web failover)
      if (whatsappSettings?.enabled) {
        const customerTemplate = getTemplate(eventType, "customer");
        if (customerTemplate) {
          const customerMessage = renderTemplate(customerTemplate, messageVars);
          try {
            await sendWhatsAppUnifiedToPhone(
              ticket.customerPhone,
              customerMessage,
              whatsappSettings.mode,
              whatsappSettings.failoverEnabled,
            );
          } catch (error) {
            console.warn("WhatsApp send failed, continuing...", error);
          }
        }
      }

      // Send to technician if assigned
      if (ticket.assignedTo !== "Unassigned" && technicianPhone) {
        const technicianTemplate = getTemplate(eventType, "technician");
        if (technicianTemplate) {
          const technicianMessage = renderTemplate(
            technicianTemplate,
            messageVars,
          );

          // Send via SMS
          if (smsSettings?.enabled) {
            await sendSmsToPhone(technicianPhone, technicianMessage);
          }

          // Send via WhatsApp (unified with Business API + Web failover)
          if (whatsappSettings?.enabled) {
            try {
              await sendWhatsAppUnifiedToPhone(
                technicianPhone,
                technicianMessage,
                whatsappSettings.mode,
                whatsappSettings.failoverEnabled,
              );
            } catch (error) {
              console.warn("WhatsApp send failed, continuing...", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send notifications:", error);
    }
  };

  // Load tickets, customers, and employees from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load customers
        try {
          const customersData = await getCustomers();
          setCustomers(customersData);
        } catch (error) {
          console.error("Failed to load customers:", error);
        }

        // Load employees
        try {
          const employeesData = await getEmployees();
          setEmployees(employeesData);
        } catch (error) {
          console.error("Failed to load employees:", error);
        }

        // Load tickets
        const dbTickets = await apiGetTickets();

        // Convert API tickets to UI format
        const uiTickets = dbTickets.map((t: ApiTicket) => ({
          id: t.id,
          customerId: t.customerId,
          customer: t.customer?.name || "Unknown",
          customerEmail: t.customer?.email || "",
          customerPhone: t.customer?.phone || "",
          customerLocation: "",
          apartment: "",
          roomNumber: "",
          title: t.subject,
          description: t.description,
          status: t.status as "open" | "in-progress" | "pending" | "resolved",
          priority: t.priority,
          createdAt: new Date(t.createdAt).toLocaleString(),
          updatedAt: new Date(t.updatedAt).toLocaleString(),
          assignedTo: t.user?.name || "Unassigned",
          smsNotificationsSent: 0,
          replies: [],
          _apiData: t, // Store original API data
        }));

        setAllTickets(uiTickets);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load data from database",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        customerId: ticket.customerId,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
      });
    } else {
      setEditingTicket(null);
      setFormData({
        customerId: "",
        title: "",
        description: "",
        status: "open",
        priority: "medium",
        assignedTo: "unassigned",
      });
    }
    setDialogOpen(true);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Phone)",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingCustomer(true);
      const createdCustomer = await apiCreateCustomer({
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        email: newCustomerData.email || "",
      });

      // Add the new customer to the list
      setCustomers((prev) => [...prev, createdCustomer]);

      // Auto-select the newly created customer
      setFormData((prev) => ({
        ...prev,
        customerId: createdCustomer.id,
      }));

      // Reset the create customer form
      setNewCustomerData({
        name: "",
        phone: "",
        email: "",
      });

      setCreateCustomerDialogOpen(false);

      toast({
        title: "Success",
        description: `Customer "${createdCustomer.name}" created and selected`,
      });
    } catch (error) {
      console.error("Create customer error:", error);
      toast({
        title: "Error",
        description: `Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSave = async () => {
    if (!formData.customerId || !formData.title || !formData.description) {
      toast({
        title: "Error",
        description:
          "Please fill in all required fields (Customer, Title, Description)",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTicket) {
        // Update existing ticket
        await apiUpdateTicket(editingTicket.id, {
          subject: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
        });

        setAllTickets((prev) =>
          prev.map((t) =>
            t.id === editingTicket.id
              ? {
                  ...t,
                  title: formData.title,
                  description: formData.description,
                  status: formData.status,
                  priority: formData.priority,
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
        // Create new ticket with customerId
        const selectedCustomer = customers.find(
          (c) => c.id === formData.customerId,
        );

        const newApiTicket = await apiCreateTicket({
          customerId: formData.customerId,
          subject: formData.title,
          description: formData.description,
          status: "open",
          priority: formData.priority,
          category: "general",
        });

        const newTicket: Ticket = {
          id: newApiTicket.id,
          customerId: formData.customerId,
          customer: selectedCustomer?.name || "Unknown",
          customerEmail: selectedCustomer?.email || "",
          customerPhone: selectedCustomer?.phone || "",
          customerLocation: "",
          apartment: "",
          roomNumber: "",
          title: formData.title,
          description: formData.description,
          status: "open",
          priority: formData.priority,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          assignedTo: "Unassigned",
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
    } catch (error) {
      console.error("Save ticket error:", error);
      toast({
        title: "Error",
        description: `Failed to save ticket: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(false);
    setFormData({
      customerId: "",
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      assignedTo: "unassigned",
    });
  };

  const handleAssignTicket = async (ticketId: string, assignee: string) => {
    try {
      const ticketToUpdate = allTickets.find((t) => t.id === ticketId);
      if (!ticketToUpdate) return;

      // Get the actual name for the assignee (either employee name or "Unassigned")
      let assigneeName = "Unassigned";
      if (assignee !== "unassigned") {
        const employee = employees.find((e) => e.id === assignee);
        assigneeName = employee?.name || assignee;
      }

      // Store assignee name as resolution note since we don't have user lookup
      await apiUpdateTicket(ticketId, {
        resolution: `Assigned to: ${assigneeName}`,
      });

      const updatedTicket: Ticket = {
        ...ticketToUpdate,
        assignedTo: assigneeName,
        updatedAt: new Date().toLocaleString(),
      };

      setAllTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? updatedTicket : t)),
      );

      // Send SMS notifications for assignment
      await sendTicketSms("ticket_assigned", updatedTicket);

      toast({
        title: "Success",
        description: `Ticket assigned to ${assigneeName}`,
      });
    } catch (error) {
      console.error("Assign ticket error:", error);
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await apiUpdateTicket(ticketId, {
        status: newStatus as
          | "open"
          | "in-progress"
          | "pending"
          | "resolved"
          | "closed",
      });

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
    } catch (error) {
      console.error("Status change error:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
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

  const handleDelete = async (ticketId: string) => {
    try {
      await apiDeleteTicket(ticketId);
      setAllTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
    } catch (error) {
      console.error("Delete ticket error:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    }
  };

  const handleOpenDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
  };

  const handleAddReply = (ticketId: string, message: string) => {
    setAllTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newReply: Reply = {
            id: `reply-${Date.now()}`,
            author: "Support Team",
            authorRole: "support",
            message,
            timestamp: new Date().toLocaleString(),
          };
          return {
            ...t,
            replies: [...(t.replies || []), newReply],
            updatedAt: new Date().toLocaleString(),
          };
        }
        return t;
      }),
    );

    if (selectedTicket) {
      setSelectedTicket({
        ...selectedTicket,
        replies: [
          ...(selectedTicket.replies || []),
          {
            id: `reply-${Date.now()}`,
            author: "Support Team",
            authorRole: "support",
            message,
            timestamp: new Date().toLocaleString(),
          },
        ],
      });
    }
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
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                Loading tickets from database...
              </p>
            </div>
          ) : (
            <>
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
                          <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {ticket.id}
                            </button>
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
                                <SelectItem value="resolved">
                                  Resolved
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
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
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {employees.map((employee) => (
                                  <SelectItem
                                    key={employee.id}
                                    value={employee.id}
                                  >
                                    {employee.name}
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
                                onClick={() => handleOpenDetail(ticket)}
                                title="View details and replies"
                              >
                                <MessageSquare size={14} />
                              </Button>
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
                                onClick={() =>
                                  handleSendSmsNotification(ticket)
                                }
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
                          <p className="text-muted-foreground">
                            No tickets found
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTickets.length} of {allTickets.length}{" "}
                  tickets
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
            </>
          )}
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer *
                </label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No customers available. Please create a customer first.
                  </p>
                )}
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
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
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

        {/* Ticket Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            {selectedTicket && (
              <TicketDetail
                ticket={selectedTicket}
                replies={selectedTicket.replies || []}
                onAddReply={handleAddReply}
                onClose={() => setDetailDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
