import { db } from "../lib/db";
import { hashPassword } from "../lib/crypto";

interface TestUserInput {
  email: string;
  phone: string;
  name?: string;
  password?: string;
}

export async function createTestUser(req: any, res: any) {
  try {
    const { email, phone, name, password } = req.body as TestUserInput;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Email and phone are required",
      });
    }

    // Use provided password or default to "test123"
    const userPassword = password || "test123";
    const hashedPassword = await hashPassword(userPassword);

    const user = await db.user.create({
      data: {
        id: "test-" + Date.now() + "-" + Math.random(),
        email,
        phone,
        password: hashedPassword,
        name: name || "Test User",
        role: "user",
        status: "active",
      },
    });

    res.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        password: userPassword,
        createdAt: user.createdAt,
      },
      loginInstructions: `You can now login with:\nEmail/Phone: ${email}\nPassword: ${userPassword}`,
    });
  } catch (error: any) {
    console.error("Error creating test user:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create test user",
    });
  }
}

export async function getTestUsers(req: any, res: any) {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        createdAt: true,
      },
      take: 10,
    });

    res.json({
      success: true,
      count: users.length,
      message: `Found ${users.length} test users`,
      users,
    });
  } catch (error: any) {
    console.error("Error fetching test users:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch test users",
    });
  }
}

export async function deleteTestUsers(req: any, res: any) {
  try {
    const result = await db.user.deleteMany({
      where: {
        id: {
          startsWith: "test-",
        },
      },
    });

    res.json({
      success: true,
      message: `Deleted ${result.count} test users`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("Error deleting test users:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete test users",
    });
  }
}

export async function checkDatabaseConnection(req: any, res: any) {
  try {
    // Test database connection by counting users
    const userCount = await db.user.count();

    res.json({
      success: true,
      message: "Database connection successful",
      databaseStatus: "connected",
      stats: {
        totalUsers: userCount,
      },
    });
  } catch (error: any) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Database connection failed",
      databaseStatus: "disconnected",
    });
  }
}
