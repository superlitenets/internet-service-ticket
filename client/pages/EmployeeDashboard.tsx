import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getTasks,
  getTimeLogs,
  getActivityLog,
} from "@/lib/ticket-workflow-client";
import { getTickets } from "@/lib/tickets-client";
import type { TicketTask } from "@/lib/ticket-workflow-client";
import type { Ticket } from "@/lib/tickets-client";

interface TaskSummary extends TicketTask {
  ticketSubject?: string;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [myTasks, setMyTasks] = useState<TaskSummary[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    totalHoursLogged: 0,
    activeTickets: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load tickets assigned to current user
      const ticketsData = await getTickets();
      const userTickets = ticketsData.filter(
        (t: Ticket) => t.userId || t.assignedTeamMemberId,
      );
      setMyTickets(userTickets);

      // Load all tasks for user's tickets and aggregate
      let allTasks: TaskSummary[] = [];
      let totalHours = 0;

      for (const ticket of userTickets) {
        try {
          const tasks = await getTasks(ticket.id);
          const tasksWithTicketInfo = tasks.map((task) => ({
            ...task,
            ticketSubject: ticket.subject,
          }));
          allTasks = [...allTasks, ...tasksWithTicketInfo];

          // Get time logs for this ticket
          const timeLogs = await getTimeLogs(ticket.id);
          totalHours += timeLogs.totalHours || 0;
        } catch (error) {
          console.error(`Failed to load tasks for ticket ${ticket.id}:`, error);
        }
      }

      setMyTasks(allTasks);

      // Calculate stats
      setStats({
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter((t) => t.status === "completed").length,
        inProgressTasks: allTasks.filter((t) => t.status === "in-progress")
          .length,
        blockedTasks: allTasks.filter((t) => t.status === "blocked").length,
        totalHoursLogged: totalHours,
        activeTickets: userTickets.filter(
          (t) => t.status !== "resolved" && t.status !== "closed",
        ).length,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center text-muted-foreground">
          Loading dashboard data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your tasks, workload, and performance metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalTasks}
                </p>
              </div>
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedTasks}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inProgressTasks}
                </p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.blockedTasks}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalHoursLogged.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tickets</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.activeTickets}
                </p>
              </div>
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">My Tasks</h2>
              <Badge variant="outline">{myTasks.length}</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks assigned yet
                </p>
              ) : (
                myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border border-border rounded-lg hover:bg-accent transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Ticket: {task.ticketSubject}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    {task.estimatedHours && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Est: {task.estimatedHours}h
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Open Tickets */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">My Tickets</h2>
              <Badge variant="outline">{myTickets.length}</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tickets assigned
                </p>
              ) : (
                myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 border border-border rounded-lg hover:bg-accent transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {ticket.customer}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(ticket.priority)}
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge
                        variant="outline"
                        className={
                          ticket.status === "resolved" ||
                          ticket.status === "closed"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {ticket.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Help Text */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Track Your Progress</p>
              <p className="mt-1">
                View your assigned tasks and tickets here. Update task status,
                log hours, and add comments directly from the ticket details
                page to keep everyone informed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
