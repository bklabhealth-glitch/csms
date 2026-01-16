import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stock-balance - ดึงรายการ Stock Balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const location = searchParams.get("location");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: "insensitive" } },
        { lotNo: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (category) {
      where.item = {
        category: category,
      };
    }

    const [balances, total] = await Promise.all([
      prisma.stockBalance.findMany({
        where,
        include: {
          item: {
            select: {
              itemCode: true,
              category: true,
              unit: true,
              minimumStock: true,
              defaultExpAlert: true,
            },
          },
        },
        orderBy: [
          { status: "desc" }, // Expired/Near Expiry first
          { itemName: "asc" },
          { expiryDate: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.stockBalance.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.stockBalance.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { totalValue: true },
    });

    const totalValue = await prisma.stockBalance.aggregate({
      _sum: { totalValue: true },
    });

    return NextResponse.json({
      balances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        byStatus: summary,
        totalValue: totalValue._sum.totalValue || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching stock balance:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
