import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockInSchema } from "@/lib/validators";
import { generateStockInNo } from "@/lib/code-generator";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/stock-in - ดึงรายการ Stock In ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const itemId = searchParams.get("itemId");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (itemId) {
      where.itemId = itemId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.importDate = {};
      if (dateFrom) {
        where.importDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.importDate.lte = new Date(dateTo);
      }
    }

    const [stockIns, total] = await Promise.all([
      prisma.stockIn.findMany({
        where,
        include: {
          item: {
            select: {
              itemCode: true,
              itemName: true,
              unit: true,
              category: true,
            },
          },
          supplier: {
            select: {
              supplierCode: true,
              companyName: true,
            },
          },
          creator: {
            select: { name: true, email: true },
          },
        },
        orderBy: { importDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockIn.count({ where }),
    ]);

    return NextResponse.json({
      stockIns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stock ins:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST /api/stock-in - สร้าง Stock In ใหม่ (Draft)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Generate stock in number
    const stockInNo = await generateStockInNo(validated.importDate);

    // Calculate total value
    const totalValue = validated.unitPrice
      ? validated.quantityIn * validated.unitPrice
      : null;

    // Set importBy to current user if not provided
    const importBy = validated.importBy || session.user.id;

    // Create stock in (as DRAFT)
    const stockIn = await prisma.stockIn.create({
      data: {
        stockInNo,
        ...validated,
        importBy,
        totalValue,
        status: "DRAFT",
        createdBy: session.user.id,
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
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_in",
      recordId: stockIn.id,
      action: "CREATE",
      newValue: stockIn,
      userId: session.user.id,
    });

    return NextResponse.json(stockIn, { status: 201 });
  } catch (error: any) {
    console.error("Error creating stock in:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรายการรับเข้า" },
      { status: 500 }
    );
  }
}
