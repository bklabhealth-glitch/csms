import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // ลด logging เพื่อเพิ่มความเร็ว
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
