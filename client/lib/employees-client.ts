export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  salary?: number;
  hireDate: string;
  status: "active" | "on_leave" | "inactive";
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new employee
 */
export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  salary?: number;
  hireDate: string;
  emergencyContact?: string;
}): Promise<Employee> {
  const response = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create employee");
  }

  const result = await response.json();
  return result.employee || result;
}

/**
 * Get all employees
 */
export async function getEmployees(): Promise<Employee[]> {
  const response = await fetch("/api/employees");

  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }

  const result = await response.json();
  return result.employees || result;
}

/**
 * Get a single employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee> {
  const response = await fetch(`/api/employees/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch employee");
  }

  const result = await response.json();
  return result.employee || result;
}

/**
 * Update an employee
 */
export async function updateEmployee(
  id: string,
  data: Partial<Omit<Employee, "id">>,
): Promise<Employee> {
  const response = await fetch(`/api/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update employee");
  }

  const result = await response.json();
  return result.employee || result;
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: string): Promise<void> {
  const response = await fetch(`/api/employees/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete employee");
  }
}
