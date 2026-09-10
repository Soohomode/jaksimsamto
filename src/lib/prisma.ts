import { PrismaClient } from "@prisma/client";

/**
 * Next.js dev 환경에서 HMR 때마다 PrismaClient가 새로 생성되어
 * 커넥션이 고갈되는 것을 막기 위한 싱글턴.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
