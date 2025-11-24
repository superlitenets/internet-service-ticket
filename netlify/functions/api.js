const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory user database
const users = new Map([
  [
    "admin@example.com",
    {
      id: "user-1",
      name: "Admin User",
      email: "admin@example.com",
      phone: "0700000001",
      role: "admin",
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
      role: "support",
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
      role: "customer",
      password: "password123",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const sessions = new Map();

function generateToken() {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateToken(token) {
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session.userId;
}

// Auth endpoints
app.post("/auth/login", (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
        error: "Missing required fields",
      });
    }

    let user = users.get(identifier);

    if (!user) {
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
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Incorrect password",
      });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    sessions.set(token, {
      userId: user.id,
      expiresAt,
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: `Login successful. Welcome ${user.name}!`,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message || "Unknown error",
    });
  }
});

app.post("/auth/logout", (req, res) => {
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
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message || "Unknown error",
    });
  }
});

app.get("/auth/verify", (req, res) => {
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

    let user = null;
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
    console.error("Verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: error.message || "Unknown error",
    });
  }
});

app.get("/auth/me", (req, res) => {
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

    let user = null;
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
    console.error("Me error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
      error: error.message || "Unknown error",
    });
  }
});

app.get("/auth/users", (_req, res) => {
  try {
    const allUsers = [];
    for (const user of users.values()) {
      const { password: _, ...userWithoutPassword } = user;
      allUsers.push(userWithoutPassword);
    }

    return res.json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message || "Unknown error",
    });
  }
});

app.get("/ping", (_req, res) => {
  res.json({ message: "pong" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

exports.handler = serverless(app);
