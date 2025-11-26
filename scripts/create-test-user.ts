import "dotenv/config";
import { db } from "../server/lib/db";
import { hashPassword } from "../server/lib/crypto";

async function main() {
  try {
    console.log("Creating test user...");

    const hashedPassword = await hashPassword("password123");

    try {
      const user = await db.user.upsert({
        where: { email: "admin@testing.com" },
        update: { status: "active" },
        create: {
          name: "Admin User",
          email: "admin@testing.com",
          phone: "0700000001",
          password: hashedPassword,
          role: "admin",
          status: "active",
        },
      });

      console.log("✓ Test user ready!");
      console.log("\nLogin with:");
      console.log("  Email: admin@testing.com");
      console.log("  Password: password123");
      console.log("\nUser ID:", user.id);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log("✓ Test user already exists");
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
