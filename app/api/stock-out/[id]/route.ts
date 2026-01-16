import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockOutSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/stock-out/[id] - ดึงข้อมูล Stock Out 1 รายการ
export async function GET(
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

    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        item: true,
        creator: {
          select: { name: true, email: true },
        },
        updater: {
          select: { name: true, email: true },
        },
      },
    });

    if (!stockOut) {
      return NextResponse.json({ error: "ไม่พบรายการเบิก" }, { status: 404 });
    }

    return NextResponse.json(stockOut);
  } catch (error) {
    console.error("Error fetching stock out:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-out/[id] - แก้ไข Stock Out (เฉพาะ DRAFT)
export async function PUT(
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

    const body = await request.json();

    // Validate input
    const validated = stockOutSchema.parse(body);

    // Get old value for audit
    const oldStockOut = await prisma.stockOut.findUnique({
      where: { id },
    });

    if (!oldStockOut) {
      return NextResponse.json({ error: "ไม่พบรายการเบิก" }, { status: 404 });
    }

    // Can only edit DRAFT
    if (oldStockOut.status !== "DRAFT") {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขรายการที่อนุมัติแล้ว" },
        { status: 400 }
      );
    }

    // Check if lot has enough quantity
    const balance = await prisma.stockBalance.findFirst({
      where: {
        itemId: validated.itemId,
        lotNo: validated.lotNo,
        quantityBalance: { gte: validated.quantityOut },
      },
    });

    if (!balance) {
      return NextResponse.json(
        { error: "สต๊อกไม่เพียงพอสำหรับ Lot นี้" },
        { status: 400 }
      );
    }

    // Update stock out
    const stockOut = await prisma.stockOut.update({
      where: { id },
      data: {
        ...validated,
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
        updater: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_out",
      recordId: stockOut.id,
      action: "UPDATE",
      oldValue: oldStockOut,
      newValue: stockOut,
      userId: session.user.id,
    });

    return NextResponse.json(stockOut);
  } catch (error: any) {
    console.error("Error updating stock out:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขรายการเบิก" },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-out/[id] - ยกเลิก Stock Out
export async function DELETE(
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

    // Check if stock out exists
    const existingStockOut = await prisma.stockOut.findUnique({
      where: { id },
    });

    if (!existingStockOut) {
      return NextResponse.json({ error: "ไม่พบรายการเบิก" }, { status: 404 });
    }

    // Can only cancel DRAFT (not yet approved)
    if (existingStockOut.status !== "DRAFT") {
      return NextResponse.json(
        { error: "ไม่สามารถยกเลิกรายการที่อนุมัติแล้ว" },
        { status: 400 }
      );
    }

    // Update status to CANCELLED
    const stockOut = await prisma.stockOut.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedBy: session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_out",
      recordId: stockOut.id,
      action: "DELETE",
      oldValue: existingStockOut,
      newValue: stockOut,
      userId: session.user.id,
    });

    return NextResponse.json({ message: "ยกเลิกรายการเบิกสำเร็จ" });
  } catch (error) {
    console.error("Error cancelling stock out:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยกเลิกรายการเบิก" },
      { status: 500 }
    );
  }
}
