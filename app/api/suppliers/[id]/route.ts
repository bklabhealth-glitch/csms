import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/suppliers/[id] - ดึงข้อมูลซัพพลายเออร์ 1 รายการ
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

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        updater: {
          select: { name: true, email: true },
        },
        stockIns: {
          orderBy: { importDate: "desc" },
          take: 10,
          include: {
            item: {
              select: { itemCode: true, itemName: true },
            },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "ไม่พบซัพพลายเออร์" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - แก้ไขข้อมูลซัพพลายเออร์
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
    const validated = supplierSchema.parse(body);

    // Get old value for audit
    const oldSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!oldSupplier) {
      return NextResponse.json({ error: "ไม่พบซัพพลายเออร์" }, { status: 404 });
    }

    // Update supplier
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...validated,
        updatedBy: session.user.id,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        updater: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "suppliers",
      recordId: supplier.id,
      action: "UPDATE",
      oldValue: oldSupplier,
      newValue: supplier,
      userId: session.user.id,
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Error updating supplier:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขซัพพลายเออร์" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - ลบซัพพลายเออร์ (Soft delete)
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

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "ไม่พบซัพพลายเออร์" }, { status: 404 });
    }

    // Soft delete (set status to INACTIVE)
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        status: "INACTIVE",
        updatedBy: session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "suppliers",
      recordId: supplier.id,
      action: "DELETE",
      oldValue: existingSupplier,
      newValue: supplier,
      userId: session.user.id,
    });

    return NextResponse.json({ message: "ลบซัพพลายเออร์สำเร็จ" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบซัพพลายเออร์" },
      { status: 500 }
    );
  }
}
