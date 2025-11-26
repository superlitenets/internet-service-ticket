import "dotenv/config";
import { db } from "../server/lib/db";
import { hashPassword } from "../server/lib/crypto";

async function main() {
  try {
    console.log("Creating test user...");

    // Check if user already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: "admin@testing.com" }, { phone: "0700000001" }],
      },
    });

    if (existing) {
      console.log("✓ Test user already exists:", existing.email);
      process.exit(0);
    }

    // Create the test user
    const hashedPassword = await hashPassword("password123");
    const user = await db.user.create({
      data: {
        name: "Admin User",
        email: "admin@testing.com",
        phone: "0700000001",
        password: hashedPassword,
        role: "admin",
        status: "active",
      },
    });

    console.log("✓ Test user created successfully!");
    console.log("\nLogin with:");
    console.log("  Email/Phone: admin@testing.com");
    console.log("  Password: password123");
    console.log("\nUser ID:", user.id);

    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
}

main();
