import { RequestHandler } from "express";
import { db } from "../lib/db";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken,
} from "../lib/crypto";
import { LoginRequest, LoginResponse, User, UserRole } from "@shared/api";

/**
 * Login endpoint
 */
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { identifier, password } = req.body as LoginRequest;

    console.log(`[LOGIN] Attempt with identifier: "${identifier}"`);

    if (!identifier || !password) {
      console.log("[LOGIN] Missing identifier or password");
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
        error: "Missing required fields",
      } as LoginResponse);
    }

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) {
      console.log(`[LOGIN] User not found with identifier: "${identifier}"`);
    } else {
      console.log(`[LOGIN] User found: ${user.email} (status: ${user.status})`);
    }

    if (!user || user.status === "inactive" || user.status === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "User not found or inactive",
      } as LoginResponse);
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password);
    console.log(
      `[LOGIN] Password verification: ${passwordValid ? "PASSED" : "FAILED"}`,
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Incorrect password",
      } as LoginResponse);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email || "");

    const userResponse: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      active: user.status === "active",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return res.json({
      success: true,
      message: `Login successful. Welcome ${user.name}!`,
      user: userResponse,
      token,
    } as LoginResponse);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    } as LoginResponse);
  }
};

/**
 * Logout endpoint
 */
export const handleLogout: RequestHandler = (req, res) => {
  try {
    // JWT tokens are stateless, so logout just means client discards the token
    // For enhanced security, you could implement token blacklisting in the future

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Verify token and get user
 */
export const verifyTokenEndpoint: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: "Missing authorization header",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: "Token validation failed",
      });
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      active: user.status === "active",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return res.json({
      success: true,
      user: userResponse,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get current user
 */
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      active: user.status === "active",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Register a new user
 */
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required",
        error: "Missing required fields",
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
        error: "Email or phone already registered",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name,
        email: email || undefined,
        phone,
        password: hashedPassword,
        role: role || "user",
        status: "active",
      },
    });

    const token = generateToken(newUser.id, newUser.email || "");

    const userResponse: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role as UserRole,
      active: newUser.status === "active",
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all users
 */
export const getAllUsers: RequestHandler = async (_req, res) => {
  try {
    const users = await db.user.findMany();

    const usersResponse: User[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      active: user.status === "active",
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return res.json({
      success: true,
      users: usersResponse,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new user
 */
export const createUser: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, password, role, active } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name,
        email: email || undefined,
        phone,
        password: hashedPassword,
        role: role || "user",
        status:
          active !== undefined ? (active ? "active" : "inactive") : "active",
      },
    });

    const userResponse: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role as UserRole,
      active: newUser.status === "active",
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a user
 */
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, active } = req.body;

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (password) updateData.password = await hashPassword(password);
    if (active !== undefined)
      updateData.status = active ? "active" : "inactive";

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    const userResponse: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role as UserRole,
      active: updatedUser.status === "active",
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a user
 */
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await db.user.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
