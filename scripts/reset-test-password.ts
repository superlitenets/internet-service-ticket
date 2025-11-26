import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = "admin@test.com";
    const newPassword = "password123";

    console.log(`Resetting password for ${email}...`);

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update or create the user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        status: "active",
      },
      create: {
        email,
        phone: "+1234567890",
        password: hashedPassword,
        role: "admin",
        name: "Admin Test",
        status: "active",
      },
    });

    console.log(`✅ Password reset successfully for ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
