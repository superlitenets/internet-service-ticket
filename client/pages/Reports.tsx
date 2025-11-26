import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, PieChart, TrendingUp, Users, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getTeamPerformance, getEmployeePerformance, type PerformanceMetric } from "@/lib/ticket-workflow-client";

interface TeamMetrics {
  metrics: PerformanceMetric[];
  teamTotals: {
    totalTicketsHandled: number;
    totalTicketsResolved: number;
    avgResolutionTime: number;
    avgSLACompliance: number;
    totalHoursLogged: number;
  };
}

export default function Reports() {
  const { toast } = useToast();
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");
  const [viewMode, setViewMode] = useState<"team" | "individual">("team");

  useEffect(() => {
    loadReports();
  }, [period, viewMode]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getTeamPerformance(period || undefined);
      setTeamMetrics(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center text-muted-foreground">
          Loading reports...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Team performance metrics, SLA compliance, and productivity insights
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-foreground mb-2">
              Period
            </label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select month..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value={getCurrentMonth()}>Current Month</SelectItem>
                <SelectItem value={`${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, "0")}`}>
                  Previous Month
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-foreground mb-2">
              View
            </label>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as "team" | "individual")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Report</SelectItem>
                <SelectItem value="individual">Individual Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {teamMetrics && (
          <>
            {/* Team Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Handled</p>
                    <p className="text-2xl font-bold text-foreground">
                      {teamMetrics.teamTotals.totalTicketsHandled}
                    </p>
                  </div>
                  <BarChart className="w-6 h-6 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {teamMetrics.teamTotals.totalTicketsResolved}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Resolution</p>
                    <p className="text-2xl font-bold text-foreground">
                      {teamMetrics.teamTotals.avgResolutionTime.toFixed(1)}h
                    </p>
                  </div>
                  <LineChart className="w-6 h-6 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Compliance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {teamMetrics.teamTotals.avgSLACompliance.toFixed(1)}%
                    </p>
                  </div>
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold text-foreground">
                      {teamMetrics.teamTotals.totalHoursLogged.toFixed(1)}h
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              </Card>
            </div>

            {/* Individual Employee Performance */}
            {viewMode === "individual" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Individual Performance Metrics
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-foreground">Employee</th>
                        <th className="text-center p-3 font-medium text-foreground">Tickets</th>
                        <th className="text-center p-3 font-medium text-foreground">Resolved</th>
                        <th className="text-center p-3 font-medium text-foreground">Overdue</th>
                        <th className="text-center p-3 font-medium text-foreground">Avg Time</th>
                        <th className="text-center p-3 font-medium text-foreground">SLA %</th>
                        <th className="text-center p-3 font-medium text-foreground">Hours</th>
                        <th className="text-center p-3 font-medium text-foreground">Task %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMetrics.metrics.map((metric) => (
                        <tr key={metric.id} className="border-b border-border hover:bg-accent">
                          <td className="p-3 font-medium text-foreground">
                            {metric.employeeName || "Unknown"}
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {metric.ticketsHandled}
                          </td>
                          <td className="p-3 text-center text-green-600 font-medium">
                            {metric.ticketsResolved}
                          </td>
                          <td className="p-3 text-center text-red-600 font-medium">
                            {metric.ticketsOverdue}
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {metric.avgResolutionHours.toFixed(1)}h
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={
                                metric.slaCompliancePercent >= 95
                                  ? "bg-green-100 text-green-800"
                                  : metric.slaCompliancePercent >= 80
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {metric.slaCompliancePercent.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {metric.totalHoursLogged.toFixed(1)}
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {metric.taskCompletionPercent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Team Distribution */}
            {viewMode === "team" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Team Size: {teamMetrics.metrics.length} members
                  </h2>

                  <div className="space-y-3">
                    {teamMetrics.metrics.slice(0, 5).map((metric) => (
                      <div
                        key={metric.id}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">
                            {metric.employeeName || "Unknown"}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              metric.slaCompliancePercent >= 95
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {metric.slaCompliancePercent.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {metric.ticketsResolved} of {metric.ticketsHandled} tickets resolved
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Key Insights</h2>

                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900 mb-1">
                        Average Resolution Time
                      </p>
                      <p className="text-blue-800">
                        {teamMetrics.teamTotals.avgResolutionTime.toFixed(1)} hours per ticket
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900 mb-1">
                        SLA Compliance Rate
                      </p>
                      <p className="text-green-800">
                        {teamMetrics.teamTotals.avgSLACompliance.toFixed(1)}% of tickets resolved on time
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="font-medium text-purple-900 mb-1">
                        Total Team Hours
                      </p>
                      <p className="text-purple-800">
                        {teamMetrics.teamTotals.totalHoursLogged.toFixed(1)} hours logged
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
