import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/balance - รายงาน Stock Balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const status = searchParams.get("status");
    const exportFormat = searchParams.get("export"); // csv, xlsx, pdf

    // Build where clause
    const where: any = {
      quantityBalance: { gt: 0 }, // Only show items with balance > 0
    };

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

    const balances = await prisma.stockBalance.findMany({
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
        { itemName: "asc" },
        { expiryDate: "asc" },
      ],
    });

    // Calculate summary
    const totalItems = balances.length;
    const totalValue = balances.reduce((sum, b) => sum + (b.totalValue || 0), 0);
    const totalQuantity = balances.reduce((sum, b) => sum + b.quantityBalance, 0);

    // Group by category
    const byCategory = balances.reduce((acc: any, b) => {
      const cat = b.item.category;
      if (!acc[cat]) {
        acc[cat] = {
          count: 0,
          totalValue: 0,
          totalQuantity: 0,
        };
      }
      acc[cat].count++;
      acc[cat].totalValue += b.totalValue || 0;
      acc[cat].totalQuantity += b.quantityBalance;
      return acc;
    }, {});

    // Group by status
    const byStatus = balances.reduce((acc: any, b) => {
      const st = b.status;
      if (!acc[st]) {
        acc[st] = { count: 0, totalValue: 0 };
      }
      acc[st].count++;
      acc[st].totalValue += b.totalValue || 0;
      return acc;
    }, {});

    const reportData = {
      generatedAt: new Date(),
      generatedBy: session.user.name,
      filters: {
        category: category || "ทั้งหมด",
        location: location || "ทั้งหมด",
        status: status || "ทั้งหมด",
      },
      summary: {
        totalItems,
        totalValue,
        totalQuantity,
      },
      breakdown: {
        byCategory,
        byStatus,
      },
      items: balances.map((b) => ({
        itemCode: b.item.itemCode,
        itemName: b.itemName,
        category: b.item.category,
        lotNo: b.lotNo,
        expiryDate: b.expiryDate,
        daysToExpiry: b.daysToExpiry,
        location: b.location,
        quantityBalance: b.quantityBalance,
        unit: b.item.unit,
        unitPrice: b.unitPrice,
        totalValue: b.totalValue,
        status: b.status,
        lastInDate: b.lastInDate,
        lastOutDate: b.lastOutDate,
      })),
    };

    // TODO: Implement export functionality (CSV, Excel, PDF)
    if (exportFormat) {
      // For now, just return JSON with a message
      return NextResponse.json({
        message: `Export to ${exportFormat} will be implemented in Phase 2`,
        data: reportData,
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating balance report:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรายงาน" },
      { status: 500 }
    );
  }
}
