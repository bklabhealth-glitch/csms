import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBalanceOnStockIn } from "@/lib/balance-calculator";
import { createAuditLog } from "@/lib/audit-logger";

// POST /api/stock-in/[id]/confirm - ยืนยัน Stock In และอัพเดท Balance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Get stock in
    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!stockIn) {
      return NextResponse.json({ error: "ไม่พบรายการรับเข้า" }, { status: 404 });
    }

    // Can only confirm DRAFT
    if (stockIn.status !== "DRAFT") {
      return NextResponse.json(
        { error: "รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว" },
        { status: 400 }
      );
    }

    // Update status to CONFIRMED
    const updatedStockIn = await prisma.stockIn.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        updatedBy: session.user.id,
      },
      include: {
        item: {
          select: {
            itemCode: true,
            itemName: true,
            unit: true,
          },
        },
        supplier: {
          select: {
            supplierCode: true,
            companyName: true,
          },
        },
      },
    });

    // Update stock balance
    try {
      await updateBalanceOnStockIn(id);
    } catch (balanceError: any) {
      console.error("Error updating balance:", balanceError);
      // Rollback status if balance update fails
      await prisma.stockIn.update({
        where: { id },
        data: {
          status: "DRAFT",
        },
      });
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการอัพเดท Stock Balance: " + balanceError.message },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      tableName: "stock_in",
      recordId: updatedStockIn.id,
      action: "UPDATE",
      oldValue: { ...stockIn, status: "DRAFT" },
      newValue: updatedStockIn,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "ยืนยันรายการรับเข้าสำเร็จ",
      stockIn: updatedStockIn,
    });
  } catch (error: any) {
    console.error("Error confirming stock in:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยืนยันรายการรับเข้า" },
      { status: 500 }
    );
  }
}
