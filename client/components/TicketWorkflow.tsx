import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Clock,
  MessageSquare,
  Activity,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  logTime,
  getTimeLogs,
  addComment,
  getComments,
  getActivityLog,
  type TicketTask,
  type TimeLog,
  type TicketComment,
  type ActivityLog,
} from "@/lib/ticket-workflow-client";

interface TicketWorkflowProps {
  ticketId: string;
  ticketSubject: string;
  currentUserId: string;
}

export default function TicketWorkflow({
  ticketId,
  ticketSubject,
  currentUserId,
}: TicketWorkflowProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState<TicketTask[]>([]);
  const [timeLogs, setTimeLogs] = useState<{
    timeLogs: TimeLog[];
    totalHours: number;
  }>({
    timeLogs: [],
    totalHours: 0,
  });
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);

  useEffect(() => {
    loadWorkflowData();
  }, [ticketId]);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      const [tasksData, timeLogsData, commentsData, activitiesData] =
        await Promise.all([
          getTasks(ticketId),
          getTimeLogs(ticketId),
          getComments(ticketId),
          getActivityLog(ticketId),
        ]);

      setTasks(tasksData);
      setTimeLogs(timeLogsData);
      setComments(commentsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to load workflow data:", error);
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Task handlers
  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTask = await createTask(ticketId, {
        title: taskTitle,
      });
      setTasks([...tasks, newTask]);
      setTaskTitle("");
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
      toast({
        title: "Success",
        description: `Task status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Time log handlers
  const handleLogTime = async () => {
    if (!timeHours || isNaN(parseFloat(timeHours))) {
      toast({
        title: "Error",
        description: "Please enter valid hours",
        variant: "destructive",
      });
      return;
    }

    try {
      await logTime({
        ticketId,
        userId: currentUserId,
        hours: parseFloat(timeHours),
      });
      setTimeHours("");
      const updated = await getTimeLogs(ticketId);
      setTimeLogs(updated);
      toast({
        title: "Success",
        description: "Time logged successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log time",
        variant: "destructive",
      });
    }
  };

  // Comment handlers
  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      toast({
        title: "Error",
        description: "Comment content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newComment = await addComment(ticketId, {
        userId: currentUserId,
        content: commentContent,
        isInternal: commentInternal,
      });
      setComments([...comments, newComment]);
      setCommentContent("");
      setCommentInternal(false);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-4">Loading...</div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Tasks ({tasks.length})
        </TabsTrigger>
        <TabsTrigger value="time" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time ({timeLogs.totalHours.toFixed(1)}h)
        </TabsTrigger>
        <TabsTrigger value="comments" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activity
        </TabsTrigger>
      </TabsList>

      {/* Tasks Tab */}
      <TabsContent value="tasks" className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">Add New Task</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Task description..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <Button onClick={handleAddTask} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </Card>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks yet. Create one to break down the work.
            </p>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleUpdateTaskStatus(task.id, e.target.value)
                      }
                      className="text-xs px-2 py-1 border border-border rounded"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {task.estimatedHours && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Estimated: {task.estimatedHours}h
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Time Logs Tab */}
      <TabsContent value="time" className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">Log Time</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Hours..."
              value={timeHours}
              onChange={(e) => setTimeHours(e.target.value)}
              step="0.5"
              min="0"
            />
            <Button onClick={handleLogTime} size="sm">
              <Clock className="w-4 h-4 mr-1" />
              Log
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            Total Hours Logged:{" "}
            <span className="text-lg">{timeLogs.totalHours.toFixed(1)}h</span>
          </p>
        </Card>

        <div className="space-y-2">
          {timeLogs.timeLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No time logged yet.
            </p>
          ) : (
            timeLogs.timeLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {log.hours}h logged by {log.user?.name || "Unknown"}
                    </p>
                    {log.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Comments Tab */}
      <TabsContent value="comments" className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">Add Comment</h3>
          <textarea
            placeholder="Write a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="w-full p-2 border border-border rounded text-sm mb-2"
            rows={3}
          />
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="internal"
              checked={commentInternal}
              onChange={(e) => setCommentInternal(e.target.checked)}
            />
            <label htmlFor="internal" className="text-sm">
              Internal note (staff only)
            </label>
          </div>
          <Button onClick={handleAddComment} size="sm">
            <MessageSquare className="w-4 h-4 mr-1" />
            Post Comment
          </Button>
        </Card>

        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm">
                    {comment.user?.name || "Unknown"}
                  </p>
                  {comment.isInternal && (
                    <Badge variant="secondary" className="text-xs">
                      Internal
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Activity Tab */}
      <TabsContent value="activity" className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet.
          </p>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {activity.user?.name && `By ${activity.user.name} • `}
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
