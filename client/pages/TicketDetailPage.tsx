import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import TicketWorkflow from "@/components/TicketWorkflow";

interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  name?: string;
  email?: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  customerId: string;
  userId?: string;
  subject: string;
  description: string;
  category?: string;
  priority: "high" | "medium" | "low";
  status:
    | "open"
    | "in-progress"
    | "bounced"
    | "waiting"
    | "resolved"
    | "closed";
  resolution?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  user_name?: string;
  user_email?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<string>("");

  // Load ticket and replies on mount
  useEffect(() => {
    if (!ticketId) {
      navigate("/tickets");
      return;
    }

    loadTicketAndReplies();
  }, [ticketId]);

  const loadTicketAndReplies = async () => {
    try {
      setLoading(true);

      // Fetch ticket
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      if (!ticketRes.ok) throw new Error("Failed to fetch ticket");
      const ticketData = await ticketRes.json();
      setTicket(ticketData.ticket);
      setNewStatus(ticketData.ticket.status);

      // Fetch replies
      const repliesRes = await fetch(`/api/tickets/${ticketId}/replies`);
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json();
        setReplies(repliesData.replies || []);
      }
    } catch (error) {
      console.error("Failed to load ticket:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      });
      navigate("/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyMessage.trim() || !ticket || !user) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSendingReply(true);
    try {
      const response = await fetch("/api/ticket-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          userId: user.id,
          message: replyMessage,
          isInternal,
        }),
      });

      if (!response.ok) throw new Error("Failed to add reply");

      const result = await response.json();
      setReplies((prev) => [...prev, result.reply]);
      setReplyMessage("");
      setIsInternal(false);

      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket) return;

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const result = await response.json();
      setTicket(result.ticket);
      setNewStatus(status);

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle size={16} className="text-destructive" />;
      case "in-progress":
        return <Clock size={16} className="text-secondary" />;
      case "bounced":
        return <AlertCircle size={16} className="text-orange-500" />;
      case "waiting":
        return <Clock size={16} className="text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 size={16} className="text-accent" />;
      case "closed":
        return <CheckCircle2 size={16} className="text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-destructive/10 text-destructive";
      case "in-progress":
        return "bg-secondary/10 text-secondary";
      case "bounced":
        return "bg-orange-500/10 text-orange-500";
      case "waiting":
        return "bg-yellow-500/10 text-yellow-500";
      case "resolved":
        return "bg-accent/10 text-accent";
      case "closed":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "";
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
        return "";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8">
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="p-6 md:p-8">
          <p className="text-destructive">Ticket not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/tickets")}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {ticket.subject}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ticket.ticketId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`gap-1.5 ${getStatusColor(ticket.status)}`}
                  >
                    {getStatusIcon(ticket.status)}
                    {ticket.status.charAt(0).toUpperCase() +
                      ticket.status.slice(1)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={getPriorityColor(ticket.priority)}
                  >
                    {ticket.priority.charAt(0).toUpperCase() +
                      ticket.priority.slice(1)}
                  </Badge>
                  {ticket.category && (
                    <Badge variant="outline">{ticket.category}</Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">
                Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </Card>

            {/* Replies */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">
                Conversation ({replies.length})
              </h3>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {replies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No replies yet. Be the first to reply!
                  </p>
                ) : (
                  replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.isInternal
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : "bg-muted/30 border border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {reply.name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reply.email}
                          </p>
                        </div>
                        {reply.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-2">
                        {reply.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Add Reply *
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="internal" className="text-sm text-foreground">
                    Internal note (only visible to staff)
                  </label>
                </div>

                <Button
                  onClick={handleAddReply}
                  disabled={sendingReply}
                  className="w-full gap-2"
                >
                  <Send size={16} />
                  {sendingReply ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Status</h3>
              <Select value={newStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Ticket Info */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">
                Ticket Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="text-foreground">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Customer</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="text-foreground">{ticket.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{ticket.customer_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-foreground">{ticket.customer_phone}</p>
                </div>
              </div>
            </Card>

            {/* Assigned To */}
            {ticket.user_name && (
              <Card className="p-6 border-0 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">
                  Assigned To
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agent</p>
                    <p className="text-foreground">{ticket.user_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="text-foreground">{ticket.user_email}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
