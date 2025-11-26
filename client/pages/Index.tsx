import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
  MessageCircle,
  Ticket as TicketIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getTickets } from "@/lib/tickets-client";

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  pending: number;
}

interface RecentTicket {
  id: string;
  customer: string;
  title: string;
  status: "open" | "in-progress" | "pending" | "resolved";
  priority: "high" | "medium" | "low";
  createdAt: string;
  assignedTo: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    pending: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        setLoading(true);
        const tickets = await getTickets();

        // Calculate stats
        const stats = {
          total: tickets.length,
          open: tickets.filter((t) => t.status === "open").length,
          inProgress: tickets.filter((t) => t.status === "in-progress").length,
          resolved: tickets.filter((t) => t.status === "resolved").length,
          pending: tickets.filter((t) => t.status === "pending").length,
        };

        setTicketStats(stats);

        // Format recent tickets
        const recent = tickets.slice(0, 5).map((t) => ({
          id: t.id,
          customer: t.customer?.name || "Unknown",
          title: t.subject,
          status: t.status as "open" | "in-progress" | "pending" | "resolved",
          priority: t.priority,
          createdAt: new Date(t.createdAt).toLocaleDateString(),
          assignedTo: t.user?.name || "Unassigned",
        }));

        setRecentTickets(recent);
      } catch (error) {
        console.error("Failed to load ticket data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTicketData();
  }, []);

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

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your ISP support tickets and customer issues
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tickets
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {ticketStats.total}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <TicketIcon size={24} className="text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Open
                </p>
                <p className="text-3xl font-bold text-destructive mt-2">
                  {ticketStats.open}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertCircle size={24} className="text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-secondary mt-2">
                  {ticketStats.inProgress}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <Clock size={24} className="text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resolved
                </p>
                <p className="text-3xl font-bold text-accent mt-2">
                  {ticketStats.resolved}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/10">
                <CheckCircle2 size={24} className="text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Team Members
                </p>
                <p className="text-3xl font-bold text-primary mt-2">12</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users size={24} className="text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tickets */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Recent Tickets
              </h2>
              <Link to="/tickets">
                <Button variant="outline" size="sm" className="gap-2">
                  View all
                  <ChevronRight size={16} />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <Card className="border-0 shadow-sm p-8 text-center">
                  <p className="text-muted-foreground">Loading tickets...</p>
                </Card>
              ) : recentTickets.length === 0 ? (
                <Card className="border-0 shadow-sm p-8 text-center">
                  <TicketIcon size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tickets yet</p>
                  <Link to="/tickets">
                    <Button className="mt-4" size="sm">
                      Create a Ticket
                    </Button>
                  </Link>
                </Card>
              ) : (
                recentTickets.map((ticket) => (
                  <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* ID and Customer */}
                        <div className="lg:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Ticket ID
                          </p>
                          <p className="font-semibold text-primary">
                            {ticket.id}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {ticket.customer}
                          </p>
                        </div>

                        {/* Title */}
                        <div className="lg:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Issue
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">
                            {ticket.title}
                          </p>
                        </div>

                        {/* Status and Priority */}
                        <div className="space-y-2">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 ${getStatusColor(ticket.status)}`}
                          >
                            {getStatusIcon(ticket.status)}
                            {ticket.status === "in-progress"
                              ? "In Progress"
                              : ticket.status.charAt(0).toUpperCase() +
                                ticket.status.slice(1)}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={getPriorityColor(ticket.priority)}
                          >
                            {ticket.priority.charAt(0).toUpperCase() +
                              ticket.priority.slice(1)}
                          </Badge>
                        </div>

                        {/* Assigned To */}
                        <div className="flex items-center justify-between lg:justify-start">
                          <p className="text-xs font-medium text-muted-foreground mb-1 lg:hidden">
                            Assigned
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.assignedTo}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link to="/tickets">
                  <Button className="w-full gap-2" variant="default">
                    <Plus size={16} />
                    New Ticket
                  </Button>
                </Link>
                <Button className="w-full gap-2" variant="outline">
                  <Users size={16} />
                  Add Customer
                </Button>
                <Button className="w-full gap-2" variant="outline">
                  <MessageCircle size={16} />
                  Send Bulk SMS
                </Button>
              </div>
            </Card>

            {/* Performance */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Avg. Resolution Time
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      4.2 hrs
                    </p>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full w-3/4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Customer Satisfaction
                    </p>
                    <p className="text-sm font-semibold text-foreground">94%</p>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full w-11/12" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      First Response Rate
                    </p>
                    <p className="text-sm font-semibold text-foreground">87%</p>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full w-10/12" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">SLA Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive">
                    1 ticket
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Breaching SLA soon
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold text-primary">
                    3 tickets
                  </p>
                  <p className="text-xs text-primary/80 mt-1">
                    Within 2 hours SLA
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
