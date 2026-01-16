import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";
import { generateSupplierCode } from "@/lib/code-generator";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/suppliers - ดึงรายการซัพพลายเออร์ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { supplierCode: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          creator: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              stockIns: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - สร้างซัพพลายเออร์ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validated = supplierSchema.parse(body);

    // Generate supplier code
    const supplierCode = await generateSupplierCode();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        ...validated,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "suppliers",
      recordId: supplier.id,
      action: "CREATE",
      newValue: supplier,
      userId: session.user.id,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างซัพพลายเออร์" },
      { status: 500 }
    );
  }
}
