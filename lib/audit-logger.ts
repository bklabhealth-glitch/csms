import { prisma } from "./prisma";

/**
 * บันทึก Audit Log
 */
export async function createAuditLog(params: {
  tableName: string;
  recordId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  oldValue?: any;
  newValue?: any;
  userId: string;
}) {
  const { tableName, recordId, action, oldValue, newValue, userId } = params;

  try {
    // ตรวจสอบว่า user มีอยู่จริงก่อนสร้าง audit log
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      console.warn(`Audit log skipped: User ${userId} not found`);
      return;
    }

    await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        oldValue: oldValue || null,
        newValue: newValue || null,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // ไม่ throw error เพื่อไม่ให้ audit log fail ทำให้ operation หลักล้มเหลว
  }
}

/**
 * ดึง Audit Log ของ record ใดๆ
 */
export async function getAuditLogs(tableName: string, recordId: string) {
  return await prisma.auditLog.findMany({
    where: {
      tableName,
      recordId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });
}
