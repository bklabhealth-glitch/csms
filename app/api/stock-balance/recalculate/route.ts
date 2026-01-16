import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateAllBalances } from "@/lib/balance-calculator";
import { createAuditLog } from "@/lib/audit-logger";

// POST /api/stock-balance/recalculate - คำนวณ Balance ใหม่ทั้งหมด
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can recalculate
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ทำรายการนี้ (เฉพาะ Admin)" },
        { status: 403 }
      );
    }

    console.log("🔄 เริ่มคำนวณ Stock Balance ใหม่...");

    const totalRecords = await recalculateAllBalances();

    console.log(`✅ คำนวณ Stock Balance สำเร็จ (${totalRecords} records)`);

    // Create audit log
    await createAuditLog({
      tableName: "stock_balance",
      recordId: "all",
      action: "UPDATE",
      newValue: { message: `Recalculated ${totalRecords} balance records` },
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "คำนวณ Stock Balance ใหม่สำเร็จ",
      totalRecords,
    });
  } catch (error: any) {
    console.error("Error recalculating balance:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการคำนวณ Balance: " + error.message },
      { status: 500 }
    );
  }
}
