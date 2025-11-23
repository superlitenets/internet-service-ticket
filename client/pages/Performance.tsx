import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Plus,
  Edit,
  Search,
  Star,
  User,
  Calendar,
  Zap,
} from "lucide-react";
import type { PerformanceReview } from "@shared/api";

export default function PerformancePage() {
  const { toast } = useToast();
  const [allReviews, setAllReviews] = useState<PerformanceReview[]>([
    {
      id: "PERF-001",
      employeeId: "EMP-001",
      employeeName: "John Smith",
      reviewPeriod: "Q4 2023",
      reviewer: "Manager",
      rating: 4.5,
      attendance: 95,
      productivity: 90,
      teamwork: 85,
      communication: 88,
      comments: "Excellent performer with strong technical skills",
      strengths: ["Problem solving", "Technical expertise", "Customer focus"],
      improvements: ["Documentation", "Time management"],
      status: "completed",
      createdAt: "2024-01-01 10:00 AM",
      updatedAt: "2024-01-10 02:30 PM",
    },
    {
      id: "PERF-002",
      employeeId: "EMP-002",
      employeeName: "Maria Garcia",
      reviewPeriod: "Q4 2023",
      reviewer: "Manager",
      rating: 4.0,
      attendance: 92,
      productivity: 88,
      teamwork: 90,
      communication: 85,
      comments: "Good performance with strong team collaboration",
      strengths: ["Teamwork", "Communication", "Reliability"],
      improvements: ["Initiative", "Leadership"],
      status: "completed",
      createdAt: "2024-01-01 10:00 AM",
      updatedAt: "2024-01-10 02:30 PM",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    reviewPeriod: "Q1 2024",
    reviewer: "Manager",
    rating: 3.5,
    attendance: 90,
    productivity: 80,
    teamwork: 80,
    communication: 80,
    comments: "",
    strengths: [] as string[],
    improvements: [] as string[],
  });

  const [newStrength, setNewStrength] = useState("");
  const [newImprovement, setNewImprovement] = useState("");

  const filteredReviews = allReviews.filter((review) => {
    const matchesSearch =
      review.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const averageRating = filteredReviews.length
    ? (
        filteredReviews.reduce((sum, r) => sum + r.rating, 0) /
        filteredReviews.length
      ).toFixed(1)
    : "N/A";

  const handleOpenDialog = (review?: PerformanceReview) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        employeeId: review.employeeId,
        employeeName: review.employeeName,
        reviewPeriod: review.reviewPeriod,
        reviewer: review.reviewer,
        rating: review.rating,
        attendance: review.attendance,
        productivity: review.productivity,
        teamwork: review.teamwork,
        communication: review.communication,
        comments: review.comments,
        strengths: review.strengths,
        improvements: review.improvements,
      });
    } else {
      setEditingReview(null);
      setFormData({
        employeeId: "",
        employeeName: "",
        reviewPeriod: "Q1 2024",
        reviewer: "Manager",
        rating: 3.5,
        attendance: 90,
        productivity: 80,
        teamwork: 80,
        communication: 80,
        comments: "",
        strengths: [],
        improvements: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSaveReview = () => {
    if (!formData.employeeId || !formData.reviewPeriod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingReview) {
      setAllReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                ...formData,
                status: "submitted" as const,
                updatedAt: new Date().toLocaleString(),
              }
            : r,
        ),
      );
      toast({
        title: "Success",
        description: "Performance review updated",
      });
    } else {
      const newReview: PerformanceReview = {
        id: `PERF-${String(allReviews.length + 1).padStart(3, "0")}`,
        ...formData,
        status: "draft",
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };
      setAllReviews((prev) => [...prev, newReview]);
      toast({
        title: "Success",
        description: "Performance review created",
      });
    }

    setDialogOpen(false);
  };

  const handleSubmitReview = (id: string) => {
    setAllReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "completed" as const,
              updatedAt: new Date().toLocaleString(),
            }
          : r,
      ),
    );
    toast({
      title: "Success",
      description: "Performance review submitted",
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4) return "text-blue-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "submitted":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance</h1>
            <p className="text-muted-foreground mt-1">
              Manage employee performance reviews and ratings
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus size={16} />
            Create Review
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
            <p className="text-2xl font-bold">{allReviews.length}</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
            <p
              className={`text-2xl font-bold ${getRatingColor(parseFloat(averageRating as string) || 0)}`}
            >
              {averageRating}
              <Star size={16} className="inline ml-1" />
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {allReviews.filter((r) => r.status === "completed").length}
            </p>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Draft</p>
            <p className="text-2xl font-bold text-yellow-600">
              {allReviews.filter((r) => r.status === "draft").length}
            </p>
          </Card>
        </div>

        <Card className="p-6 border-0 shadow-sm">
          <div className="mb-6">
            <Input
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp
                  size={32}
                  className="mx-auto text-muted-foreground mb-2"
                />
                <p className="text-muted-foreground">
                  No performance reviews found
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {review.employeeName}
                        </h3>
                        <Badge variant={getStatusColor(review.status)}>
                          {review.status}
                        </Badge>
                        <Badge variant="outline">{review.reviewPeriod}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-bold ${getRatingColor(review.rating)}`}
                      >
                        {review.rating}
                      </p>
                      <p className="text-xs text-muted-foreground">/ 5.0</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {review.comments}
                  </p>

                  <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Attendance</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${review.attendance}%` }}
                        />
                      </div>
                      <p className="font-semibold mt-1">{review.attendance}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Productivity</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${review.productivity}%` }}
                        />
                      </div>
                      <p className="font-semibold mt-1">
                        {review.productivity}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teamwork</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${review.teamwork}%` }}
                        />
                      </div>
                      <p className="font-semibold mt-1">{review.teamwork}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Communication</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${review.communication}%` }}
                        />
                      </div>
                      <p className="font-semibold mt-1">
                        {review.communication}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    {review.strengths.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Strengths</p>
                        <div className="flex flex-wrap gap-1">
                          {review.strengths.map((strength, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {review.improvements.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Areas for Improvement
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {review.improvements.map((improvement, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {improvement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {review.status !== "completed" && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReview(review.id)}
                      >
                        Submit Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(review)}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Performance Review Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReview
                  ? "Edit Performance Review"
                  : "Create Performance Review"}
              </DialogTitle>
              <DialogDescription>
                {editingReview
                  ? "Update employee performance review"
                  : "Create a new performance review for an employee"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Employee
                  </label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => {
                      const name = value.includes("-")
                        ? value.split("-")[1]
                        : "Unknown";
                      setFormData({
                        ...formData,
                        employeeId: value,
                        employeeName: name,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMP-001-John Smith">
                        John Smith
                      </SelectItem>
                      <SelectItem value="EMP-002-Maria Garcia">
                        Maria Garcia
                      </SelectItem>
                      <SelectItem value="EMP-003-Alex Johnson">
                        Alex Johnson
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Review Period
                  </label>
                  <Input
                    value={formData.reviewPeriod}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewPeriod: e.target.value })
                    }
                    placeholder="Q1 2024"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Overall Rating
                  </label>
                  <Select
                    value={formData.rating.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rating: parseFloat(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1.0</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2.0</SelectItem>
                      <SelectItem value="2.5">2.5</SelectItem>
                      <SelectItem value="3">3.0</SelectItem>
                      <SelectItem value="3.5">3.5</SelectItem>
                      <SelectItem value="4">4.0</SelectItem>
                      <SelectItem value="4.5">4.5</SelectItem>
                      <SelectItem value="5">5.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Attendance (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.attendance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendance: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Productivity (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.productivity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productivity: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Teamwork (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.teamwork}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        teamwork: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Communication (%)
                </label>
                <Input
                  type="number"
                  value={formData.communication}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      communication: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Comments
                </label>
                <Textarea
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  placeholder="Enter performance review comments..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Strengths
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="Add a strength..."
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newStrength.trim()) {
                        setFormData({
                          ...formData,
                          strengths: [...formData.strengths, newStrength],
                        });
                        setNewStrength("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.strengths.map((strength, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          strengths: formData.strengths.filter(
                            (_, i) => i !== idx,
                          ),
                        });
                      }}
                    >
                      {strength} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Areas for Improvement
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newImprovement}
                    onChange={(e) => setNewImprovement(e.target.value)}
                    placeholder="Add an improvement area..."
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newImprovement.trim()) {
                        setFormData({
                          ...formData,
                          improvements: [
                            ...formData.improvements,
                            newImprovement,
                          ],
                        });
                        setNewImprovement("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.improvements.map((improvement, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          improvements: formData.improvements.filter(
                            (_, i) => i !== idx,
                          ),
                        });
                      }}
                    >
                      {improvement} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReview}>
                {editingReview ? "Update" : "Create"} Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
