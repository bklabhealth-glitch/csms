import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/items/[id] - ดึงข้อมูลสินค้า 1 รายการ
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

    const item = await prisma.itemMaster.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        updater: {
          select: { name: true, email: true },
        },
        stockBalance: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - แก้ไขข้อมูลสินค้า
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
    const validated = itemSchema.parse(body);

    // Get old value for audit
    const oldItem = await prisma.itemMaster.findUnique({
      where: { id },
    });

    if (!oldItem) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    // Update item
    const item = await prisma.itemMaster.update({
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
      tableName: "item_master",
      recordId: item.id,
      action: "UPDATE",
      oldValue: oldItem,
      newValue: item,
      userId: session.user.id,
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error updating item:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - ลบสินค้า (Soft delete)
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

    // Check if item exists
    const existingItem = await prisma.itemMaster.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    // Soft delete (set status to INACTIVE)
    const item = await prisma.itemMaster.update({
      where: { id },
      data: {
        status: "INACTIVE",
        updatedBy: session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "item_master",
      recordId: item.id,
      action: "DELETE",
      oldValue: existingItem,
      newValue: item,
      userId: session.user.id,
    });

    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบสินค้า" },
      { status: 500 }
    );
  }
}
