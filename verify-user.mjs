import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@testing.com' },
          { phone: '0700000002' }
        ]
      }
    });

    if (user) {
      console.log('User found:');
      console.log(`- Email: ${user.email}`);
      console.log(`- Phone: ${user.phone}`);
      console.log(`- Status: ${user.status}`);
      console.log(`- Role: ${user.role}`);
      
      if (user.status !== 'active') {
        console.log('\n⚠️  User status is NOT active. Updating to active...');
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'active' }
        });
        console.log('✓ User status updated to active');
      } else {
        console.log('\n✓ User status is already active');
      }
    } else {
      console.log('✗ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
