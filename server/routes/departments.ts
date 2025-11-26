import { RequestHandler } from "express";
import { db } from "../lib/db";

/**
 * Create a new department
 */
export const createDepartment: RequestHandler = async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const existingDept = await db.department.findUnique({
      where: { name },
    });

    if (existingDept) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const department = await db.department.create({
      data: {
        name,
        description: description || undefined,
        manager: manager || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("Create department error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all departments
 */
export const getDepartments: RequestHandler = async (_req, res) => {
  try {
    const departments = await db.department.findMany({
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      departments,
      count: departments.length,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single department by ID
 */
export const getDepartmentById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.department.findUnique({
      where: { id },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Get department error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a department
 */
export const updateDepartment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manager } = req.body;

    const department = await db.department.findUnique({
      where: { id },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (manager !== undefined) updateData.manager = manager;

    const updatedDepartment = await db.department.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Department updated successfully",
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("Update department error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a department
 */
export const deleteDepartment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db.department.findUnique({
      where: { id },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await db.department.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new team group
 */
export const createTeamGroup: RequestHandler = async (req, res) => {
  try {
    const { name, description, departmentId, manager } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Team group name is required",
      });
    }

    const existingGroup = await db.teamGroup.findUnique({
      where: { name },
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: "Team group already exists",
      });
    }

    const teamGroup = await db.teamGroup.create({
      data: {
        name,
        description: description || undefined,
        departmentId: departmentId || undefined,
        manager: manager || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Team group created successfully",
      teamGroup,
    });
  } catch (error) {
    console.error("Create team group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create team group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all team groups
 */
export const getTeamGroups: RequestHandler = async (_req, res) => {
  try {
    const teamGroups = await db.teamGroup.findMany({
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      teamGroups,
      count: teamGroups.length,
    });
  } catch (error) {
    console.error("Get team groups error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team groups",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a single team group by ID
 */
export const getTeamGroupById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const teamGroup = await db.teamGroup.findUnique({
      where: { id },
    });

    if (!teamGroup) {
      return res.status(404).json({
        success: false,
        message: "Team group not found",
      });
    }

    return res.json({
      success: true,
      teamGroup,
    });
  } catch (error) {
    console.error("Get team group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a team group
 */
export const updateTeamGroup: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, departmentId, manager } = req.body;

    const teamGroup = await db.teamGroup.findUnique({
      where: { id },
    });

    if (!teamGroup) {
      return res.status(404).json({
        success: false,
        message: "Team group not found",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (manager !== undefined) updateData.manager = manager;

    const updatedTeamGroup = await db.teamGroup.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Team group updated successfully",
      teamGroup: updatedTeamGroup,
    });
  } catch (error) {
    console.error("Update team group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update team group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a team group
 */
export const deleteTeamGroup: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const teamGroup = await db.teamGroup.findUnique({
      where: { id },
    });

    if (!teamGroup) {
      return res.status(404).json({
        success: false,
        message: "Team group not found",
      });
    }

    await db.teamGroup.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Team group deleted successfully",
    });
  } catch (error) {
    console.error("Delete team group error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete team group",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Add employee to team/department
 */
export const addTeamMember: RequestHandler = async (req, res) => {
  try {
    const { employeeId, departmentId, teamGroupId, role } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const teamMember = await db.teamMember.create({
      data: {
        employeeId,
        departmentId: departmentId || undefined,
        teamGroupId: teamGroupId || undefined,
        role: role || "Member",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Employee added to team/department",
      teamMember,
    });
  } catch (error) {
    console.error("Add team member error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add team member",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all team members
 */
export const getTeamMembers: RequestHandler = async (_req, res) => {
  try {
    const members = await db.teamMember.findMany({
      include: {
        department: true,
        teamGroup: true,
      },
      orderBy: [{ teamGroupId: "asc" }, { employeeId: "asc" }],
    });

    return res.json({
      success: true,
      teamMembers: members,
      count: members.length,
    });
  } catch (error) {
    console.error("Get team members error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get team memberships for an employee
 */
export const getEmployeeTeamMemberships: RequestHandler = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const memberships = await db.teamMember.findMany({
      where: { employeeId },
      include: {
        department: true,
        teamGroup: true,
      },
    });

    return res.json({
      success: true,
      teamMemberships: memberships,
    });
  } catch (error) {
    console.error("Get employee team memberships error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team memberships",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
