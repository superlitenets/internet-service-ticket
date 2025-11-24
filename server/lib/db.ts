import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function closePrismaClient() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Singleton instance
export const db = getPrismaClient();
