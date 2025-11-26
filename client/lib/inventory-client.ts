export interface POSItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  reorderLevel: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface POSTransaction {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "mpesa" | "check";
  paymentStatus: "pending" | "completed" | "refunded";
  cashier?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(data: {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  reorderLevel?: number;
}): Promise<POSItem> {
  const response = await fetch("/api/inventory/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create inventory item");
  }

  const result = await response.json();
  return result.item || result;
}

/**
 * Get all inventory items
 */
export async function getInventoryItems(): Promise<POSItem[]> {
  const response = await fetch("/api/inventory/items");

  if (!response.ok) {
    throw new Error("Failed to fetch inventory items");
  }

  const result = await response.json();
  return result.items || result;
}

/**
 * Get a single inventory item by ID
 */
export async function getInventoryItemById(id: string): Promise<POSItem> {
  const response = await fetch(`/api/inventory/items/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch inventory item");
  }

  const result = await response.json();
  return result.item || result;
}

/**
 * Update an inventory item
 */
export async function updateInventoryItem(
  id: string,
  data: Partial<Omit<POSItem, "id">>,
): Promise<POSItem> {
  const response = await fetch(`/api/inventory/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update inventory item");
  }

  const result = await response.json();
  return result.item || result;
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: string): Promise<void> {
  const response = await fetch(`/api/inventory/items/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete inventory item");
  }
}

/**
 * Create a POS transaction
 */
export async function createPOSTransaction(data: {
  customerId?: string;
  customerName?: string;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "mpesa" | "check";
  cashier?: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
  }>;
}): Promise<POSTransaction> {
  const response = await fetch("/api/inventory/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create POS transaction");
  }

  const result = await response.json();
  return result.transaction || result;
}

/**
 * Get all POS transactions
 */
export async function getPOSTransactions(): Promise<POSTransaction[]> {
  const response = await fetch("/api/inventory/transactions");

  if (!response.ok) {
    throw new Error("Failed to fetch POS transactions");
  }

  const result = await response.json();
  return result.transactions || result;
}

/**
 * Get a single POS transaction by ID
 */
export async function getPOSTransactionById(id: string): Promise<POSTransaction> {
  const response = await fetch(`/api/inventory/transactions/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch POS transaction");
  }

  const result = await response.json();
  return result.transaction || result;
}
