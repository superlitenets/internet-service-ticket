import "dotenv/config";
import { db } from "../server/lib/db";

async function main() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("Users in database:");
    console.log(JSON.stringify(users, null, 2));

    if (users.length === 0) {
      console.log("\nNo users found! You need to create one.");
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
