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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  History,
  Link2,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  createInventoryItem,
  getInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/inventory-client";

interface InventoryItem {
  id: string;
  name: string;
  type: "router" | "modem" | "cable" | "ont" | "cpe" | "splitter" | "other";
  model: string;
  serialNumber: string;
  quantity: number;
  condition: "new" | "good" | "fair" | "poor";
  costPerUnit: number;
  purchaseDate: string;
  warrantyExpiration: string;
  assignedTo?: string;
  assignedLocation?: string;
  createdAt: string;
}

interface InventoryHistory {
  id: string;
  itemId: string;
  action: "created" | "assigned" | "returned" | "damaged" | "updated";
  details: string;
  timestamp: string;
  performedBy: string;
}

interface AssignmentRequest {
  id: string;
  itemId: string;
  itemName: string;
  requestedBy: string;
  customerId: string;
  status: "pending" | "approved" | "assigned" | "returned";
  requestDate: string;
  assignedDate?: string;
  returnedDate?: string;
  notes: string;
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedItemForAssignment, setSelectedItemForAssignment] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "router" as const,
    model: "",
    serialNumber: "",
    quantity: 1,
    condition: "new" as const,
    costPerUnit: 0,
    purchaseDate: "",
    warrantyExpiration: "",
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    customerId: "",
    notes: "",
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<InventoryHistory[]>([]);

  const [assignmentRequests, setAssignmentRequests] = useState<
    AssignmentRequest[]
  >([]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const items = await getInventoryItems();
        const mappedItems: InventoryItem[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.category || "other",
          model: item.description || "",
          serialNumber: item.sku,
          quantity: item.quantity,
          condition: "good",
          costPerUnit: item.unitPrice,
          purchaseDate: new Date().toISOString().split("T")[0],
          warrantyExpiration: "",
          createdAt: new Date(item.createdAt).toISOString().split("T")[0],
        }));
        setInventoryItems(mappedItems);
        setHistory([]);
        setAssignmentRequests([]);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load inventory",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesCondition =
      conditionFilter === "all" || item.condition === conditionFilter;

    return matchesSearch && matchesType && matchesCondition;
  });

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        model: item.model,
        serialNumber: item.serialNumber,
        quantity: item.quantity,
        condition: item.condition,
        costPerUnit: item.costPerUnit,
        purchaseDate: item.purchaseDate,
        warrantyExpiration: item.warrantyExpiration,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        type: "router",
        model: "",
        serialNumber: "",
        quantity: 1,
        condition: "new",
        costPerUnit: 0,
        purchaseDate: "",
        warrantyExpiration: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.model || !formData.serialNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, {
          name: formData.name,
          description: formData.model,
          category: formData.type,
          unitPrice: formData.costPerUnit,
          quantity: formData.quantity,
        });
        setInventoryItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...formData } : item,
          ),
        );
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        });
      } else {
        const newItem = await createInventoryItem({
          name: formData.name,
          sku: formData.serialNumber,
          description: formData.model,
          category: formData.type,
          unitPrice: formData.costPerUnit,
          quantity: formData.quantity,
        });
        const mappedItem: InventoryItem = {
          id: newItem.id,
          name: newItem.name,
          type: newItem.category || "other",
          model: newItem.description || "",
          serialNumber: newItem.sku,
          quantity: newItem.quantity,
          condition: "good",
          costPerUnit: newItem.unitPrice,
          purchaseDate: new Date().toISOString().split("T")[0],
          warrantyExpiration: "",
          createdAt: new Date(newItem.createdAt).toISOString().split("T")[0],
        };
        setInventoryItems((prev) => [...prev, mappedItem]);
        toast({
          title: "Success",
          description: "Inventory item added successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save inventory item",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(false);
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteInventoryItem(itemId);
      setInventoryItems((prev) => prev.filter((item) => item.id !== itemId));
      setDeleteConfirm(null);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  const handleAssignItem = () => {
    if (!assignmentFormData.customerId || !selectedItemForAssignment) {
      toast({
        title: "Error",
        description: "Please select customer and item",
        variant: "destructive",
      });
      return;
    }

    const item = inventoryItems.find((i) => i.id === selectedItemForAssignment);
    if (!item) return;

    setInventoryItems((prev) =>
      prev.map((i) =>
        i.id === selectedItemForAssignment
          ? {
              ...i,
              assignedTo: assignmentFormData.customerId,
              quantity: Math.max(0, i.quantity - 1),
            }
          : i,
      ),
    );

    setAssignmentRequests((prev) => [
      ...prev,
      {
        id: `req_${Date.now()}`,
        itemId: selectedItemForAssignment,
        itemName: item.name,
        requestedBy: "System",
        customerId: assignmentFormData.customerId,
        status: "assigned",
        requestDate: new Date().toISOString().split("T")[0],
        assignedDate: new Date().toISOString().split("T")[0],
        notes: assignmentFormData.notes,
      },
    ]);

    setHistory((prev) => [
      ...prev,
      {
        id: `hist_${Date.now()}`,
        itemId: selectedItemForAssignment,
        action: "assigned",
        details: `Assigned to ${assignmentFormData.customerId}`,
        timestamp: new Date().toISOString().split("T")[0],
        performedBy: "Current User",
      },
    ]);

    toast({
      title: "Success",
      description: "Equipment assigned successfully",
    });

    setAssignmentDialogOpen(false);
    setAssignmentFormData({ customerId: "", notes: "" });
    setSelectedItemForAssignment(null);
  };

  const handleApproveRequest = (requestId: string) => {
    setAssignmentRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r)),
    );
    toast({
      title: "Success",
      description: "Request approved",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "router":
        return "bg-primary/10 text-primary";
      case "modem":
        return "bg-secondary/10 text-secondary";
      case "cable":
        return "bg-accent/10 text-accent";
      case "ont":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-accent/10 text-accent";
      case "good":
        return "bg-primary/10 text-primary";
      case "fair":
        return "bg-primary/10 text-primary";
      case "poor":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-primary/10 text-primary";
      case "approved":
        return "bg-secondary/10 text-secondary";
      case "assigned":
        return "bg-accent/10 text-accent";
      case "returned":
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const totalInventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.costPerUnit,
    0,
  );

  const lowStockItems = inventoryItems.filter((item) => item.quantity <= 5);

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Track equipment, routers, modems, and other inventory
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            <Plus size={18} />
            Add Equipment
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {inventoryItems.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Package size={24} className="text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Units
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <BarChart3 size={24} className="text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Inventory Value
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  ${totalInventoryValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/10">
                <BarChart3 size={24} className="text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock
                </p>
                <p className="text-3xl font-bold text-destructive mt-2">
                  {lowStockItems.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertCircle size={24} className="text-destructive" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 gap-2">
            <TabsTrigger value="inventory" className="gap-2">
              <Package size={16} />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Link2 size={16} />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History size={16} />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <AlertCircle size={16} />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search by name, model, or serial..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="modem">Modem</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="ont">ONT</SelectItem>
                    <SelectItem value="cpe">CPE</SelectItem>
                    <SelectItem value="splitter">Splitter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={conditionFilter}
                  onValueChange={setConditionFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Condition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {item.model}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              className={getTypeColor(item.type)}
                              variant="secondary"
                            >
                              {item.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              className={getConditionColor(item.condition)}
                              variant="secondary"
                            >
                              {item.condition.charAt(0).toUpperCase() +
                                item.condition.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {item.assignedTo ? (
                              <div>
                                <p className="font-medium text-foreground">
                                  {item.assignedTo}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.assignedLocation}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            $
                            {(
                              item.quantity * item.costPerUnit
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItemForAssignment(item.id);
                                  setAssignmentDialogOpen(true);
                                }}
                              >
                                <Link2 size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm(item.id)}
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
                            No inventory items found
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Assigned Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventoryItems
                      .filter((item) => item.assignedTo)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {item.assignedTo}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {item.assignedLocation || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {item.createdAt}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge className="gap-1" variant="secondary">
                              <CheckCircle2 size={14} />
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Item ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Performed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history
                      .slice()
                      .reverse()
                      .map((h) => (
                        <tr
                          key={h.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-primary">
                            {h.itemId}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant="outline">
                              {h.action.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {h.details}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {h.performedBy}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {h.timestamp}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Requested For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Request Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignmentRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {req.itemName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {req.requestedBy}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {req.customerId}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={getRequestStatusColor(req.status)}
                            variant="secondary"
                          >
                            {req.status.charAt(0).toUpperCase() +
                              req.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {req.requestDate}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {req.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(req.id)}
                            >
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Equipment" : "Add Equipment"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update equipment details"
                  : "Add new equipment to inventory"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Equipment Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Gigabit Router"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as
                          | "router"
                          | "modem"
                          | "cable"
                          | "ont"
                          | "cpe"
                          | "splitter"
                          | "other",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="modem">Modem</SelectItem>
                      <SelectItem value="cable">Cable</SelectItem>
                      <SelectItem value="ont">ONT</SelectItem>
                      <SelectItem value="cpe">CPE</SelectItem>
                      <SelectItem value="splitter">Splitter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Model *
                  </label>
                  <Input
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="e.g., GR-1000X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Serial Number *
                  </label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serialNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., SN-001-GR-1000X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cost Per Unit
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPerUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Condition
                  </label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        condition: value as "new" | "good" | "fair" | "poor",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Purchase Date
                  </label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Warranty Expiration
                  </label>
                  <Input
                    type="date"
                    value={formData.warrantyExpiration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warrantyExpiration: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? "Update" : "Add"} Equipment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog
          open={assignmentDialogOpen}
          onOpenChange={setAssignmentDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Equipment</DialogTitle>
              <DialogDescription>
                Assign this equipment to a customer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Customer *
                </label>
                <Select
                  value={assignmentFormData.customerId}
                  onValueChange={(value) =>
                    setAssignmentFormData({
                      ...assignmentFormData,
                      customerId: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                    <SelectItem value="Tech Startup Inc">
                      Tech Startup Inc
                    </SelectItem>
                    <SelectItem value="Global Industries">
                      Global Industries
                    </SelectItem>
                    <SelectItem value="Finance Corp">Finance Corp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={assignmentFormData.notes}
                  onChange={(e) =>
                    setAssignmentFormData({
                      ...assignmentFormData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Add any notes about this assignment..."
                  className="w-full p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignItem}>Assign Equipment</Button>
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
              <DialogTitle>Delete Equipment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this equipment? This action
                cannot be undone.
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
      </div>
    </Layout>
  );
}
