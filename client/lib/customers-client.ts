export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType?: string;
  status: "active" | "suspended" | "inactive";
  registeredAt: string;
  updatedAt: string;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: {
  name: string;
  email: string;
  phone: string;
  accountType?: string;
}): Promise<Customer> {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create customer");
  }

  const result = await response.json();
  return result.customer || result;
}

/**
 * Get all customers
 */
export async function getCustomers(): Promise<Customer[]> {
  const response = await fetch("/api/customers");

  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }

  const result = await response.json();
  return result.customers || result;
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch customer");
  }

  const result = await response.json();
  return result.customer || result;
}

/**
 * Update a customer
 */
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "id">>,
): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update customer");
  }

  const result = await response.json();
  return result.customer || result;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<void> {
  const response = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete customer");
  }
}
