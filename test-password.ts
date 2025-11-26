import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: "admin@testing.com",
      },
    });

    if (!user) {
      console.log("✗ User not found");
      return;
    }

    console.log("Testing password verification...");
    console.log(`User: ${user.email}`);
    console.log(`Stored hash: ${user.password.substring(0, 20)}...`);

    const testPassword = "password123";
    const isValid = await bcryptjs.compare(testPassword, user.password);

    if (isValid) {
      console.log(`✓ Password "password123" is CORRECT`);
    } else {
      console.log(`✗ Password "password123" is INCORRECT`);
      console.log("\nAttempting to set correct password hash...");

      const newHash = await bcryptjs.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });

      console.log("✓ Password hash updated");
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
