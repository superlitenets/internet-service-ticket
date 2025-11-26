import "dotenv/config";
import { db } from "../server/lib/db";
import { hashPassword } from "../server/lib/crypto";

async function main() {
  try {
    console.log("Setting up test user...");

    const hashedPassword = await hashPassword("password123");

    const user = await db.user.create({
      data: {
        name: "Admin User",
        email: "admin@testing.com",
        phone: "0700000002",
        password: hashedPassword,
        role: "admin",
        status: "active",
      },
    });

    console.log("✓ Test user created successfully!");
    console.log("\nLogin Credentials:");
    console.log("  Email/Phone: admin@testing.com");
    console.log("  Password: password123");
    console.log("\nUser ID:", user.id);

    process.exit(0);
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log(
        "✓ User admin@testing.com already exists - ready to login!",
      );
      console.log("\nLogin with:");
      console.log("  Email: admin@testing.com");
      console.log("  Password: password123");
    } else {
      console.error(
        "Error:",
        error instanceof Error ? error.message : error,
      );
    }
    process.exit(0);
  }
}

main();
