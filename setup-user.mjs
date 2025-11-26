import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";
import { hashSync } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  try {
    console.log("Setting up test user...");
    const hashedPassword = hashSync("password123", 10);

    const user = await db.user.upsert({
      where: { email: "admin@testing.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@testing.com",
        phone: "0700000002",
        password: hashedPassword,
        role: "admin",
        status: "active",
      },
    });

    console.log("✓ Test user ready!");
    console.log("\nLogin with:");
    console.log("  Email: admin@testing.com");
    console.log("  Password: password123");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
