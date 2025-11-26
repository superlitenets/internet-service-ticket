import { PrismaClient } from "./generated/prisma/client.ts";

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if test user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: "admin@testing.com" }, { phone: "0700000002" }],
      },
    });

    if (user) {
      console.log("✓ Test user found:");
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
    } else {
      console.log("✗ Test user NOT found in database");
      console.log("  Creating test user...");

      // Import password hashing
      const bcryptjs = await import("bcryptjs");
      const hashedPassword = await bcryptjs.default.hash("password123", 10);

      const newUser = await prisma.user.create({
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
      console.log(`  Email: ${newUser.email}`);
      console.log(`  Phone: ${newUser.phone}`);
      console.log(`  Password: password123`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
