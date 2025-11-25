import pkg from "@prisma/client";
const { PrismaClient } = pkg;

let prisma: any | undefined;

export function getPrismaClient(): any {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        errorFormat: "pretty",
      });
    } catch (error) {
      console.error("Failed to initialize Prisma Client:", error);
      throw error;
    }
  }
  return prisma;
}

export async function closePrismaClient() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

// Lazy singleton - only created when first accessed
export const db = new Proxy(
  {},
  {
    get(target, prop) {
      return getPrismaClient()[prop as string];
    },
  }
) as any;
