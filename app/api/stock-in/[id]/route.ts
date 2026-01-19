import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockInSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/stock-in/[id] - ดึงข้อมูล Stock In 1 รายการ
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

    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        item: true,
        supplier: true,
        creator: {
          select: { name: true, email: true },
        },
        updater: {
          select: { name: true, email: true },
        },
      },
    });

    if (!stockIn) {
      return NextResponse.json({ error: "ไม่พบรายการรับเข้า" }, { status: 404 });
    }

    return NextResponse.json(stockIn);
  } catch (error) {
    console.error("Error fetching stock in:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-in/[id] - แก้ไข Stock In (รองรับทั้ง DRAFT และ CONFIRMED)
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

    // Convert date strings to Date objects
    if (body.expiryDate) {
      body.expiryDate = new Date(body.expiryDate);
    }
    if (body.importDate) {
      body.importDate = new Date(body.importDate);
    }

    // Validate input
    const validated = stockInSchema.parse(body);

    // Get old value for audit
    const oldStockIn = await prisma.stockIn.findUnique({
      where: { id },
    });

    if (!oldStockIn) {
      return NextResponse.json({ error: "ไม่พบรายการรับเข้า" }, { status: 404 });
    }

    // Cannot edit CANCELLED records
    if (oldStockIn.status === "CANCELLED") {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขรายการที่ยกเลิกแล้ว" },
        { status: 400 }
      );
    }

    // Calculate total value
    const totalValue = validated.unitPrice
      ? validated.quantityIn * validated.unitPrice
      : null;

    // If editing a CONFIRMED record, need to update stock balance
    const isConfirmed = oldStockIn.status === "CONFIRMED";
    const quantityDiff = validated.quantityIn - oldStockIn.quantityIn;
    const locationChanged = validated.storageLocation !== oldStockIn.storageLocation;
    const lotChanged = validated.lotNo !== oldStockIn.lotNo;
    const itemChanged = validated.itemId !== oldStockIn.itemId;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update stock in record
      const stockIn = await tx.stockIn.update({
        where: { id },
        data: {
          ...validated,
          totalValue,
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
          updater: {
            select: { name: true, email: true },
          },
        },
      });

      // If CONFIRMED, update stock balance
      if (isConfirmed) {
        // If item, lot, or location changed - need to move balance from old to new
        if (itemChanged || lotChanged || locationChanged) {
          // Decrease old balance
          const oldBalance = await tx.stockBalance.findUnique({
            where: {
              itemId_lotNo_location: {
                itemId: oldStockIn.itemId,
                lotNo: oldStockIn.lotNo,
                location: oldStockIn.storageLocation,
              },
            },
          });

          if (oldBalance) {
            const newOldBalance = oldBalance.quantityBalance - oldStockIn.quantityIn;
            if (newOldBalance <= 0) {
              // Delete if balance becomes zero or negative
              await tx.stockBalance.delete({
                where: { id: oldBalance.id },
              });
            } else {
              await tx.stockBalance.update({
                where: { id: oldBalance.id },
                data: {
                  quantityBalance: newOldBalance,
                  totalValue: oldBalance.unitPrice ? newOldBalance * oldBalance.unitPrice : null,
                },
              });
            }
          }

          // Get item info for new balance
          const item = await tx.itemMaster.findUnique({
            where: { id: validated.itemId },
          });

          // Create or update new balance
          await tx.stockBalance.upsert({
            where: {
              itemId_lotNo_location: {
                itemId: validated.itemId,
                lotNo: validated.lotNo,
                location: validated.storageLocation || "",
              },
            },
            update: {
              quantityBalance: { increment: validated.quantityIn },
              unitPrice: validated.unitPrice,
              totalValue: validated.unitPrice
                ? { increment: validated.quantityIn * validated.unitPrice }
                : null,
              expiryDate: validated.expiryDate,
              lastInDate: validated.importDate,
            },
            create: {
              itemId: validated.itemId,
              itemName: item?.itemName || "",
              lotNo: validated.lotNo,
              expiryDate: validated.expiryDate,
              location: validated.storageLocation || "",
              quantityBalance: validated.quantityIn,
              unitPrice: validated.unitPrice,
              totalValue: validated.unitPrice
                ? validated.quantityIn * validated.unitPrice
                : null,
              lastInDate: validated.importDate,
            },
          });
        } else if (quantityDiff !== 0) {
          // Only quantity changed - simple update
          await tx.stockBalance.update({
            where: {
              itemId_lotNo_location: {
                itemId: oldStockIn.itemId,
                lotNo: oldStockIn.lotNo,
                location: oldStockIn.storageLocation,
              },
            },
            data: {
              quantityBalance: { increment: quantityDiff },
              unitPrice: validated.unitPrice,
              totalValue: validated.unitPrice
                ? { increment: quantityDiff * validated.unitPrice }
                : null,
              expiryDate: validated.expiryDate,
            },
          });
        } else {
          // Only other fields changed (expiry, price, etc.)
          await tx.stockBalance.update({
            where: {
              itemId_lotNo_location: {
                itemId: oldStockIn.itemId,
                lotNo: oldStockIn.lotNo,
                location: oldStockIn.storageLocation,
              },
            },
            data: {
              unitPrice: validated.unitPrice,
              totalValue: validated.unitPrice
                ? oldStockIn.quantityIn * validated.unitPrice
                : null,
              expiryDate: validated.expiryDate,
            },
          });
        }
      }

      return stockIn;
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_in",
      recordId: result.id,
      action: "UPDATE",
      oldValue: oldStockIn,
      newValue: result,
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating stock in:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขรายการรับเข้า" },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-in/[id] - ยกเลิก Stock In
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

    // Check if stock in exists
    const existingStockIn = await prisma.stockIn.findUnique({
      where: { id },
    });

    if (!existingStockIn) {
      return NextResponse.json({ error: "ไม่พบรายการรับเข้า" }, { status: 404 });
    }

    // Can only cancel DRAFT or CONFIRMED (not yet used in stock out)
    if (existingStockIn.status === "CANCELLED") {
      return NextResponse.json(
        { error: "รายการนี้ถูกยกเลิกแล้ว" },
        { status: 400 }
      );
    }

    // Update status to CANCELLED
    const stockIn = await prisma.stockIn.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedBy: session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_in",
      recordId: stockIn.id,
      action: "DELETE",
      oldValue: existingStockIn,
      newValue: stockIn,
      userId: session.user.id,
    });

    return NextResponse.json({ message: "ยกเลิกรายการรับเข้าสำเร็จ" });
  } catch (error) {
    console.error("Error cancelling stock in:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยกเลิกรายการรับเข้า" },
      { status: 500 }
    );
  }
}
