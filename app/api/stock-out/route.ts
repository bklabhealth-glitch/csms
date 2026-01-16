import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockOutSchema } from "@/lib/validators";
import { generateStockOutNo } from "@/lib/code-generator";
import { createAuditLog } from "@/lib/audit-logger";

// GET /api/stock-out - ดึงรายการ Stock Out ทั้งหมด
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
    const requestDept = searchParams.get("requestDept");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (itemId) {
      where.itemId = itemId;
    }

    if (requestDept) {
      where.requestDept = { contains: requestDept, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.outDate = {};
      if (dateFrom) {
        where.outDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.outDate.lte = new Date(dateTo);
      }
    }

    const [stockOuts, total] = await Promise.all([
      prisma.stockOut.findMany({
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
          creator: {
            select: { name: true, email: true },
          },
        },
        orderBy: { outDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockOut.count({ where }),
    ]);

    return NextResponse.json({
      stockOuts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stock outs:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// POST /api/stock-out - สร้าง Stock Out ใหม่ (Draft)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Convert date strings to Date objects
    if (body.outDate) {
      body.outDate = new Date(body.outDate);
    }

    // Validate input
    const validated = stockOutSchema.parse(body);

    // Validate lotNo
    if (!validated.lotNo || validated.lotNo.trim() === "") {
      return NextResponse.json(
        { error: "กรุณาเลือก Lot ที่ต้องการเบิก" },
        { status: 400 }
      );
    }

    // Set default values if not provided
    const requestBy = validated.requestBy || session.user.id;
    const requestDept = validated.requestDept || "ไม่ระบุ";

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
        {
          error: "สต๊อกไม่เพียงพอสำหรับ Lot นี้",
          details: "กรุณาตรวจสอบจำนวนคงเหลือ",
        },
        { status: 400 }
      );
    }

    // Generate stock out number
    const stockOutNo = await generateStockOutNo(validated.outDate);

    // Create stock out (as DRAFT - waiting for approval in Phase 2)
    // For Phase 1, we auto-approve
    const stockOut = await prisma.stockOut.create({
      data: {
        stockOutNo,
        ...validated,
        requestBy,
        requestDept,
        status: "DRAFT", // Phase 1: Will be manually approved via API
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
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      tableName: "stock_out",
      recordId: stockOut.id,
      action: "CREATE",
      newValue: stockOut,
      userId: session.user.id,
    });

    return NextResponse.json(stockOut, { status: 201 });
  } catch (error: any) {
    console.error("Error creating stock out:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรายการเบิก" },
      { status: 500 }
    );
  }
}
