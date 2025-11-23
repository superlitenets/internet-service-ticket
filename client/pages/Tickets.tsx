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
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Ticket {
  id: string;
  customer: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "pending" | "resolved";
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  smsNotificationsSent: number;
}

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const allTickets: Ticket[] = [
    {
      id: "TK-001",
      customer: "Acme Corp",
      title: "Internet connectivity issues on Floor 3",
      description: "Experiencing intermittent disconnections",
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
      title: "Monthly billing inquiry",
      description: "Questions about invoice charges",
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
      title: "Router replacement request",
      description: "Old router needs replacement",
      status: "open",
      priority: "medium",
      createdAt: "2024-01-14 03:45 PM",
      updatedAt: "2024-01-14 03:45 PM",
      assignedTo: "Unassigned",
      smsNotificationsSent: 0,
    },
    {
      id: "TK-004",
      customer: "Finance Corp",
      title: "VPN configuration setup",
      description: "Need help with VPN setup for remote team",
      status: "in-progress",
      priority: "high",
      createdAt: "2024-01-14 11:20 AM",
      updatedAt: "2024-01-15 10:15 AM",
      assignedTo: "Alex Chen",
      smsNotificationsSent: 3,
    },
    {
      id: "TK-005",
      customer: "Retail Solutions",
      title: "Speed upgrade completed",
      description: "Upgraded to 1GB fiber plan",
      status: "resolved",
      priority: "low",
      createdAt: "2024-01-12 08:00 AM",
      updatedAt: "2024-01-15 04:30 PM",
      assignedTo: "Mike Johnson",
      smsNotificationsSent: 2,
    },
    {
      id: "TK-006",
      customer: "Medical Center",
      title: "Network outage - Emergency",
      description: "Complete network failure affecting operations",
      status: "in-progress",
      priority: "high",
      createdAt: "2024-01-15 11:50 AM",
      updatedAt: "2024-01-15 12:45 PM",
      assignedTo: "Mike Johnson",
      smsNotificationsSent: 4,
    },
    {
      id: "TK-007",
      customer: "Education Institute",
      title: "WiFi coverage improvement",
      description: "Weak signal in library area",
      status: "pending",
      priority: "medium",
      createdAt: "2024-01-13 02:30 PM",
      updatedAt: "2024-01-15 10:00 AM",
      assignedTo: "Sarah Smith",
      smsNotificationsSent: 1,
    },
    {
      id: "TK-008",
      customer: "Enterprise Solutions",
      title: "Bandwidth throttling investigation",
      description: "Customer reports slower than expected speeds",
      status: "open",
      priority: "medium",
      createdAt: "2024-01-15 08:20 AM",
      updatedAt: "2024-01-15 08:20 AM",
      assignedTo: "Unassigned",
      smsNotificationsSent: 0,
    },
  ];

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
          <Button className="w-full md:w-auto gap-2" size="lg">
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

        {/* Tickets List */}
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
                    Created
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
                      <td className="px-6 py-4 text-sm font-semibold text-primary">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="hover:underline"
                        >
                          {ticket.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {ticket.customer}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${getStatusColor(ticket.status)}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </Badge>
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {ticket.assignedTo}
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {ticket.createdAt.split(" ")[0]}
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
      </div>
    </Layout>
  );
}
