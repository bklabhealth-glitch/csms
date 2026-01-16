import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/low-stock - รายงานสินค้าใกล้หมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const exportFormat = searchParams.get("export"); // csv, xlsx, pdf

    // Get all items with their total balance
    const items = await prisma.itemMaster.findMany({
      where: {
        status: "ACTIVE",
        ...(category && { category: category as any }),
      },
      include: {
        stockBalance: {
          where: {
            quantityBalance: { gt: 0 },
          },
        },
      },
    });

    // Calculate total balance per item and compare with minimum stock
    const lowStockItems = items
      .map((item) => {
        const totalBalance = item.stockBalance.reduce(
          (sum, b) => sum + b.quantityBalance,
          0
        );
        const totalValue = item.stockBalance.reduce(
          (sum, b) => sum + (b.totalValue || 0),
          0
        );

        const shortage = item.minimumStock - totalBalance;
        const percentageRemaining =
          item.minimumStock > 0 ? (totalBalance / item.minimumStock) * 100 : 0;

        return {
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          unit: item.unit,
          currentStock: totalBalance,
          minimumStock: item.minimumStock,
          shortage: shortage > 0 ? shortage : 0,
          percentageRemaining,
          totalValue,
          lotsCount: item.stockBalance.length,
          responsiblePerson: item.responsiblePerson,
          storageLocation: item.storageLocation,
          suggestedOrderQuantity: shortage > 0 ? Math.ceil(shortage * 1.5) : 0, // Order 1.5x shortage
          severity:
            totalBalance === 0
              ? "CRITICAL"
              : totalBalance <= item.minimumStock * 0.5
              ? "HIGH"
              : totalBalance <= item.minimumStock
              ? "MEDIUM"
              : "LOW",
        };
      })
      .filter((item) => item.currentStock <= item.minimumStock)
      .sort((a, b) => {
        // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
        const severityOrder: any = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    // Calculate summary
    const criticalCount = lowStockItems.filter(
      (i) => i.severity === "CRITICAL"
    ).length;
    const highCount = lowStockItems.filter((i) => i.severity === "HIGH").length;
    const mediumCount = lowStockItems.filter((i) => i.severity === "MEDIUM").length;
    const totalValueAtRisk = lowStockItems.reduce((sum, i) => sum + i.totalValue, 0);

    const reportData = {
      generatedAt: new Date(),
      generatedBy: session.user.name,
      filters: {
        category: category || "ทั้งหมด",
      },
      summary: {
        totalLowStockItems: lowStockItems.length,
        criticalCount, // Out of stock
        highCount, // <= 50% of minimum
        mediumCount, // <= 100% of minimum
        totalValueAtRisk,
      },
      items: lowStockItems,
    };

    // TODO: Implement export functionality
    if (exportFormat) {
      return NextResponse.json({
        message: `Export to ${exportFormat} will be implemented in Phase 2`,
        data: reportData,
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating low stock report:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรายงาน" },
      { status: 500 }
    );
  }
}
