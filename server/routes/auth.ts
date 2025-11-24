import { RequestHandler } from "express";
import { LoginRequest, LoginResponse, User, UserRole } from "@shared/api";

// In-memory user database (for demo purposes)
let users: Map<string, User & { password: string }> = new Map([
  [
    "admin@example.com",
    {
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      phone: "0700000001",
      role: "admin" as UserRole,
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "support@example.com",
    {
      id: "user-2",
      name: "Support Team",
      email: "support@example.com",
      phone: "0700000002",
      role: "support" as UserRole,
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "0722000000",
    {
      id: "user-3",
      name: "Customer User",
      email: "customer@example.com",
      phone: "0722000000",
      role: "customer" as UserRole,
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

// In-memory session tokens (normally use JWT or database)
let sessions: Map<
  string,
  {
    userId: string;
    expiresAt: number;
  }
> = new Map();

// Generate a simple token (in production, use JWT)
function generateToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate token
function validateToken(token: string): string | null {
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session.userId;
}

/**
 * Login endpoint
 */
export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { identifier, password } = req.body as LoginRequest;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
        error: "Missing required fields",
      } as LoginResponse);
    }

    // Find user by email or phone
    let user = users.get(identifier);

    if (!user) {
      // Try to find by phone if identifier looks like a phone
      for (const u of users.values()) {
        if (u.phone === identifier || u.email === identifier) {
          user = u;
          break;
        }
      }
    }

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "User not found or inactive",
      } as LoginResponse);
    }

    // Verify password (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Incorrect password",
      } as LoginResponse);
    }

    // Create session token
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    sessions.set(token, {
      userId: user.id,
      expiresAt,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: `Login successful. Welcome ${user.name}!`,
      user: userWithoutPassword,
      token,
    } as LoginResponse);
  } catch (error) {
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
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      sessions.delete(token);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
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
export const verifyToken: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: "Missing authorization header",
      });
    }

    const userId = validateToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: "Token validation failed",
      });
    }

    // Find user by ID
    let user: (User & { password: string }) | null = null;
    for (const u of users.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      user: userWithoutPassword,
      message: "Token is valid",
    });
  } catch (error) {
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
export const getCurrentUser: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const userId = validateToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Find user by ID
    let user: (User & { password: string }) | null = null;
    for (const u of users.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Register a new user (admin only in production)
 */
export const handleRegister: RequestHandler = (req, res) => {
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
    if (users.has(email || phone)) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
        error: "Email or phone already registered",
      });
    }

    // Create new user
    const userId = `user-${Date.now()}`;
    const newUser: User & { password: string } = {
      id: userId,
      name,
      email: email || undefined,
      phone,
      role: role || "customer",
      password,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store user (use email as primary key if available, otherwise phone)
    const key = email || phone;
    users.set(key, newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
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
export const getAllUsers: RequestHandler = (_req, res) => {
  try {
    const allUsers: User[] = [];
    for (const user of users.values()) {
      const { password: _, ...userWithoutPassword } = user;
      allUsers.push(userWithoutPassword);
    }

    return res.json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
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
export const createUser: RequestHandler = (req, res) => {
  try {
    const { name, email, phone, password, role, active } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required",
      });
    }

    // Check if user already exists
    if (users.has(email || phone)) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const userId = `user-${Date.now()}`;
    const newUser: User & { password: string } = {
      id: userId,
      name,
      email: email || undefined,
      phone,
      role: role || "customer",
      password,
      active: active !== undefined ? active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = email || phone;
    users.set(key, newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
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
export const updateUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, active } = req.body;

    // Find user by ID
    let userToUpdate: (User & { password: string }) | null = null;
    let userKey: string | null = null;

    for (const [key, user] of users.entries()) {
      if (user.id === id) {
        userToUpdate = user;
        userKey = key;
        break;
      }
    }

    if (!userToUpdate || !userKey) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user
    const updatedUser: User & { password: string } = {
      ...userToUpdate,
      name: name || userToUpdate.name,
      email: email !== undefined ? email : userToUpdate.email,
      phone: phone || userToUpdate.phone,
      role: role || userToUpdate.role,
      active: active !== undefined ? active : userToUpdate.active,
      password: password || userToUpdate.password,
      updatedAt: new Date().toISOString(),
    };

    // Update in storage
    users.delete(userKey);
    const newKey = email || phone || userKey;
    users.set(newKey, updatedUser);

    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
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
export const deleteUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete user
    for (const [key, user] of users.entries()) {
      if (user.id === id) {
        users.delete(key);
        return res.json({
          success: true,
          message: "User deleted successfully",
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
