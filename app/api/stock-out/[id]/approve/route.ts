import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBalanceOnStockOut } from "@/lib/balance-calculator";
import { createAuditLog } from "@/lib/audit-logger";

// POST /api/stock-out/[id]/approve - อนุมัติ Stock Out และอัพเดท Balance
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

    // Get stock out
    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!stockOut) {
      return NextResponse.json({ error: "ไม่พบรายการเบิก" }, { status: 404 });
    }

    // Can only approve DRAFT
    if (stockOut.status !== "DRAFT") {
      return NextResponse.json(
        { error: "รายการนี้ถูกอนุมัติหรือยกเลิกไปแล้ว" },
        { status: 400 }
      );
    }

    // Check if sufficient stock
    const balance = await prisma.stockBalance.findFirst({
      where: {
        itemId: stockOut.itemId,
        lotNo: stockOut.lotNo,
        quantityBalance: { gte: stockOut.quantityOut },
      },
    });

    if (!balance) {
      return NextResponse.json(
        { error: "สต๊อกไม่เพียงพอ ไม่สามารถอนุมัติได้" },
        { status: 400 }
      );
    }

    // Update status to APPROVED
    const updatedStockOut = await prisma.stockOut.update({
      where: { id },
      data: {
        status: "APPROVED",
        approveBy: session.user.name || session.user.email,
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
      },
    });

    // Update stock balance
    try {
      await updateBalanceOnStockOut(id);
    } catch (balanceError: any) {
      console.error("Error updating balance:", balanceError);
      // Rollback status if balance update fails
      await prisma.stockOut.update({
        where: { id },
        data: {
          status: "DRAFT",
          approveBy: null,
        },
      });
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการอัพเดท Stock Balance: " + balanceError.message },
        { status: 500 }
      );
    }

    // Create audit log
    await createAuditLog({
      tableName: "stock_out",
      recordId: updatedStockOut.id,
      action: "UPDATE",
      oldValue: { ...stockOut, status: "DRAFT" },
      newValue: updatedStockOut,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "อนุมัติรายการเบิกสำเร็จ",
      stockOut: updatedStockOut,
    });
  } catch (error: any) {
    console.error("Error approving stock out:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอนุมัติรายการเบิก" },
      { status: 500 }
    );
  }
}
