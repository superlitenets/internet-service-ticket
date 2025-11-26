export interface TeamGroup {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  manager?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  employeeId: string;
  departmentId?: string;
  teamGroupId?: string;
  role?: string;
  department?: {
    id: string;
    name: string;
  };
  teamGroup?: {
    id: string;
    name: string;
  };
}

/**
 * Get all team groups
 */
export async function getTeamGroups(): Promise<TeamGroup[]> {
  const response = await fetch("/api/team-groups");

  if (!response.ok) {
    throw new Error("Failed to fetch team groups");
  }

  const result = await response.json();
  return result.teamGroups || [];
}

/**
 * Get all team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch("/api/team-members");

  if (!response.ok) {
    throw new Error("Failed to fetch team members");
  }

  const result = await response.json();
  return result.teamMembers || [];
}

/**
 * Get team memberships for an employee
 */
export async function getEmployeeTeamMemberships(
  employeeId: string,
): Promise<TeamMember[]> {
  const response = await fetch(`/api/team-members/employee/${employeeId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch employee team memberships");
  }

  const result = await response.json();
  return result.teamMemberships || [];
}

/**
 * Create a new team group
 */
export async function createTeamGroup(data: {
  name: string;
  description?: string;
  departmentId?: string;
  manager?: string;
}): Promise<TeamGroup> {
  const response = await fetch("/api/team-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create team group");
  }

  const result = await response.json();
  return result.teamGroup || result;
}

/**
 * Add team member to a team/department
 */
export async function addTeamMember(data: {
  employeeId: string;
  departmentId?: string;
  teamGroupId?: string;
  role?: string;
}): Promise<TeamMember> {
  const response = await fetch("/api/team-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to add team member");
  }

  const result = await response.json();
  return result.teamMember || result;
}
