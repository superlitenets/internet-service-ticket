import { PrismaClient } from "../generated/prisma/index.js";

let prisma: any | undefined;

export function getPrismaClient(): any {
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
