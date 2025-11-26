export interface Payment {
  id: string;
  invoiceId?: string;
  accountId: string;
  userId?: string;
  customerId?: string;
  amount: number;
  paymentMethod: "mpesa" | "bank-transfer" | "cash" | "check";
  mpesaReceiptNumber?: string;
  transactionId?: string;
  status: "pending" | "completed" | "failed";
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new payment
 */
export async function createPayment(data: {
  invoiceId?: string;
  accountId: string;
  userId?: string;
  customerId?: string;
  amount: number;
  paymentMethod: "mpesa" | "bank-transfer" | "cash" | "check";
  mpesaReceiptNumber?: string;
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
}): Promise<Payment> {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create payment");
  }

  const result = await response.json();
  return result.payment || result;
}

/**
 * Get all payments
 */
export async function getPayments(): Promise<Payment[]> {
  const response = await fetch("/api/payments");

  if (!response.ok) {
    throw new Error("Failed to fetch payments");
  }

  const result = await response.json();
  return result.payments || result;
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch payment");
  }

  const result = await response.json();
  return result.payment || result;
}

/**
 * Get payments by invoice ID
 */
export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  const response = await fetch(`/api/payments/invoice/${invoiceId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch invoice payments");
  }

  const result = await response.json();
  return result.payments || result;
}

/**
 * Get payments by customer ID
 */
export async function getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  const response = await fetch(`/api/payments/customer/${customerId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch customer payments");
  }

  const result = await response.json();
  return result.payments || result;
}

/**
 * Update a payment
 */
export async function updatePayment(
  id: string,
  data: Partial<Omit<Payment, "id">>,
): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update payment");
  }

  const result = await response.json();
  return result.payment || result;
}

/**
 * Delete a payment
 */
export async function deletePayment(id: string): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete payment");
  }
}
