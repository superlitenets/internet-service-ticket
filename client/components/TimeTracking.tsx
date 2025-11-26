import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  logTime,
  getTimeLogs,
  deleteTimeLog,
  formatHours,
  getTotalHours,
  getTeamMemberTotal,
  type TimeLog,
} from "@/lib/time-logs-client";

interface TimeTrackingProps {
  ticketId: string;
  currentUserId: string;
  currentUserName: string;
  onTimeLogged?: (timeLogs: TimeLog[]) => void;
}

export default function TimeTracking({
  ticketId,
  currentUserId,
  currentUserName,
  onTimeLogged,
}: TimeTrackingProps) {
  const { toast } = useToast();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [hours, setHours] = useState<string>("0.5");
  const [description, setDescription] = useState<string>("");
  const [logDate, setLogDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [expandedForm, setExpandedForm] = useState(false);

  // Load time logs on mount
  const loadTimeLogs = async () => {
    try {
      setLoading(true);
      const logs = await getTimeLogs(ticketId);
      setTimeLogs(logs);
    } catch (error) {
      console.error("Failed to load time logs:", error);
      toast({
        title: "Error",
        description: "Failed to load time logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load logs when component mounts
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    loadTimeLogs();
    setInitialized(true);
  }

  const handleLogTime = async () => {
    if (!hours || parseFloat(hours) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const newLog = await logTime({
        ticketId,
        userId: currentUserId,
        hours: parseFloat(hours),
        description: description || undefined,
        date: logDate,
      });

      setTimeLogs((prev) => [newLog, ...prev]);
      setHours("0.5");
      setDescription("");
      setLogDate(new Date().toISOString().split("T")[0]);
      setExpandedForm(false);

      toast({
        title: "Success",
        description: `Logged ${formatHours(parseFloat(hours))} for this ticket`,
      });

      if (onTimeLogged) {
        onTimeLogged([newLog, ...timeLogs]);
      }
    } catch (error) {
      console.error("Failed to log time:", error);
      toast({
        title: "Error",
        description: "Failed to log time",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteTimeLog(logId);
      setTimeLogs((prev) => prev.filter((log) => log.id !== logId));

      toast({
        title: "Success",
        description: "Time log deleted",
      });

      if (onTimeLogged) {
        onTimeLogged(timeLogs.filter((log) => log.id !== logId));
      }
    } catch (error) {
      console.error("Failed to delete time log:", error);
      toast({
        title: "Error",
        description: "Failed to delete time log",
        variant: "destructive",
      });
    }
  };

  const totalHours = getTotalHours(timeLogs);
  const userTotalHours = getTeamMemberTotal(timeLogs, currentUserId);

  // Group logs by user
  const logsByUser = timeLogs.reduce(
    (acc, log) => {
      const userId = log.userId;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(log);
      return acc;
    },
    {} as Record<string, TimeLog[]>,
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Time Tracking</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Track time spent by team members on this ticket
          </p>
        </div>

        {/* Time Log Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">
              Total Time Logged
            </div>
            <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Your Time</div>
            <div className="text-2xl font-bold">
              {formatHours(userTotalHours)}
            </div>
          </div>
        </div>

        {/* Log Time Form */}
        <div className="border-t pt-6">
          <button
            onClick={() => setExpandedForm(!expandedForm)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
          >
            <Plus size={16} />
            Log Time
          </button>

          {expandedForm && (
            <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hours
                  </label>
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g., 2.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter hours (supports decimals like 2.5)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you work on?"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleLogTime}
                  disabled={submitting}
                  className="gap-2"
                >
                  <Clock size={16} />
                  {submitting ? "Logging..." : "Log Time"}
                </Button>
                <Button
                  onClick={() => {
                    setExpandedForm(false);
                    setDescription("");
                    setHours("0.5");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Time Logs List */}
        {timeLogs.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock size={16} />
              Time Log History
            </h4>

            {Object.entries(logsByUser).map(([userId, userLogs]) => (
              <div key={userId} className="space-y-2">
                {/* User header */}
                {userLogs.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {userLogs[0].user?.name || "Unknown"}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {formatHours(getTotalHours(userLogs))}
                    </Badge>
                  </div>
                )}

                {/* User logs */}
                <div className="ml-3 space-y-2">
                  {userLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 bg-muted/30 rounded border border-border/30 text-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatHours(log.hours)}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(log.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-muted-foreground mt-1">
                            {log.description}
                          </p>
                        )}
                      </div>
                      {userId === currentUserId && (
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete time log"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && timeLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p>No time logged yet</p>
            <p className="text-xs mt-1">Start by clicking "Log Time" above</p>
          </div>
        )}
      </div>
    </Card>
  );
}
