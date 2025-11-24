import Layout from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reply {
  id: string;
  author: string;
  authorRole: "customer" | "support" | "admin";
  message: string;
  timestamp: string;
}

interface Ticket {
  id: string;
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

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load ticket from localStorage or state
  useEffect(() => {
    if (!ticketId) {
      navigate("/tickets");
      return;
    }

    try {
      // Try to get all tickets from localStorage
      const ticketsData = localStorage.getItem("tickets_data");
      if (ticketsData) {
        const tickets: Ticket[] = JSON.parse(ticketsData);
        const foundTicket = tickets.find((t) => t.id === ticketId);
        if (foundTicket) {
          setTicket(foundTicket);
          setReplies(foundTicket.replies || []);
          setLoading(false);
          return;
        }
      }

      // If not found in localStorage, show error
      toast({
        title: "Error",
        description: "Ticket not found",
        variant: "destructive",
      });
      navigate("/tickets");
    } catch (error) {
      console.error("Failed to load ticket:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      });
      navigate("/tickets");
    }
  }, [ticketId, navigate, toast]);

  const handleAddReply = async () => {
    if (!replyMessage.trim() || !ticket) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSendingReply(true);
    try {
      const newReply: Reply = {
        id: `reply_${Date.now()}`,
        author: "Support Team",
        authorRole: "support",
        message: replyMessage,
        timestamp: new Date().toLocaleString(),
      };

      const updatedReplies = [...replies, newReply];
      setReplies(updatedReplies);

      // Update ticket in localStorage
      const ticketsData = localStorage.getItem("tickets_data");
      if (ticketsData) {
        const tickets: Ticket[] = JSON.parse(ticketsData);
        const updatedTickets = tickets.map((t) =>
          t.id === ticket.id
            ? { ...t, replies: updatedReplies, updatedAt: new Date().toLocaleString() }
            : t
        );
        localStorage.setItem("tickets_data", JSON.stringify(updatedTickets));
      }

      setReplyMessage("");
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error) {
      console.error("Failed to add reply:", error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
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

  const getStatusLabel = (status: string) => {
    return status === "in-progress"
      ? "In Progress"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getAuthorColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary/10 text-primary";
      case "support":
        return "bg-secondary/10 text-secondary";
      case "customer":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="p-6 md:p-8 space-y-4">
          <Button variant="ghost" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Ticket not found</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {ticket.title}
            </h1>
            <p className="text-muted-foreground mt-2">
              Ticket {ticket.id} • Created {ticket.createdAt}
            </p>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-0 shadow-sm bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Customer</p>
            <p className="font-semibold text-foreground">{ticket.customer}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {ticket.customerEmail}
            </p>
            <p className="text-sm text-muted-foreground">
              {ticket.customerPhone}
            </p>
            {(ticket.apartment || ticket.roomNumber) && (
              <>
                {ticket.apartment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Apt: {ticket.apartment}
                  </p>
                )}
                {ticket.roomNumber && (
                  <p className="text-sm text-muted-foreground">
                    Room: {ticket.roomNumber}
                  </p>
                )}
              </>
            )}
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">
              Status & Priority
            </p>
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(ticket.status)}>
                {getStatusLabel(ticket.status)}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority.charAt(0).toUpperCase() +
                  ticket.priority.slice(1)}{" "}
                Priority
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Assigned to: <span className="font-semibold">{ticket.assignedTo}</span>
            </p>
          </Card>
        </div>

        {ticket.customerLocation && (
          <Card className="p-4 border-0 shadow-sm bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Location</p>
            <p className="text-sm text-foreground">{ticket.customerLocation}</p>
          </Card>
        )}

        {/* Original Description */}
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">
            ORIGINAL TICKET
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </Card>

        {/* Conversation Thread */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">
            Conversation ({replies.length})
          </h3>

          {replies.length === 0 ? (
            <Card className="p-6 border-0 shadow-sm text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <Card
                  key={reply.id}
                  className="p-4 border-0 shadow-sm bg-muted/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {reply.author}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getAuthorColor(reply.authorRole)}`}
                      >
                        {reply.authorRole.charAt(0).toUpperCase() +
                          reply.authorRole.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {reply.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {reply.message}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reply Input */}
        <Card className="p-6 border-0 shadow-sm bg-muted/30">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              Add Reply
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              disabled={sendingReply}
            />
            <Button
              onClick={handleAddReply}
              disabled={sendingReply || !replyMessage.trim()}
              className="w-full gap-2"
            >
              <Send size={16} />
              {sendingReply ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
