export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: "present" | "absent" | "late" | "half-day";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an attendance record
 */
export async function createAttendanceRecord(data: {
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: "present" | "absent" | "late" | "half-day";
  notes?: string;
}): Promise<AttendanceRecord> {
  const response = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create attendance record");
  }

  const result = await response.json();
  return result.record || result;
}

/**
 * Get all attendance records
 */
export async function getAttendanceRecords(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.employeeId) params.append("employeeId", filters.employeeId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/attendance${query}`);

  if (!response.ok) {
    throw new Error("Failed to fetch attendance records");
  }

  const result = await response.json();
  return result.records || result;
}

/**
 * Get attendance records for an employee
 */
export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  params.append("employeeId", employeeId);
  
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await fetch(`/api/attendance?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch employee attendance");
  }

  const result = await response.json();
  return result.records || result;
}

/**
 * Get a single attendance record by ID
 */
export async function getAttendanceRecordById(id: string): Promise<AttendanceRecord> {
  const response = await fetch(`/api/attendance/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch attendance record");
  }

  const result = await response.json();
  return result.record || result;
}

/**
 * Update an attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  data: Partial<Omit<AttendanceRecord, "id">>,
): Promise<AttendanceRecord> {
  const response = await fetch(`/api/attendance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update attendance record");
  }

  const result = await response.json();
  return result.record || result;
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceRecord(id: string): Promise<void> {
  const response = await fetch(`/api/attendance/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete attendance record");
  }
}
