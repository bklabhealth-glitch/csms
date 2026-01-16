import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/stats - ดึงสถิติสำหรับ Dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Total Inventory Value
    const inventoryValue = await prisma.stockBalance.aggregate({
      _sum: {
        totalValue: true,
      },
    });

    // 2. Count by Status
    const statusCounts = await prisma.stockBalance.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const lowStockCount =
      statusCounts.find((s) => s.status === "LOW_STOCK")?._count.status || 0;
    const nearExpiryCount =
      statusCounts.find((s) => s.status === "NEAR_EXPIRY")?._count.status || 0;
    const expiredCount =
      statusCounts.find((s) => s.status === "EXPIRED")?._count.status || 0;

    // 3. Total Items
    const totalItems = await prisma.itemMaster.count({
      where: { status: "ACTIVE" },
    });

    // 4. Total Suppliers
    const totalSuppliers = await prisma.supplier.count({
      where: { status: "ACTIVE" },
    });

    // 5. Recent transactions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentStockIns, recentStockOuts] = await Promise.all([
      prisma.stockIn.count({
        where: {
          importDate: { gte: thirtyDaysAgo },
          status: "CONFIRMED",
        },
      }),
      prisma.stockOut.count({
        where: {
          outDate: { gte: thirtyDaysAgo },
          status: "APPROVED",
        },
      }),
    ]);

    // 6. Top 5 Items by Value
    const topItemsByValue = await prisma.stockBalance.groupBy({
      by: ["itemId", "itemName"],
      _sum: {
        totalValue: true,
      },
      orderBy: {
        _sum: {
          totalValue: "desc",
        },
      },
      take: 5,
    });

    // 7. Top 5 Most Issued Items (last 30 days)
    const topIssuedItems = await prisma.stockOut.groupBy({
      by: ["itemId"],
      where: {
        outDate: { gte: thirtyDaysAgo },
        status: "APPROVED",
      },
      _sum: {
        quantityOut: true,
      },
      orderBy: {
        _sum: {
          quantityOut: "desc",
        },
      },
      take: 5,
    });

    // Get item details for top issued items
    const itemIds = topIssuedItems.map((item) => item.itemId);
    const items = await prisma.itemMaster.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, itemCode: true, itemName: true, unit: true },
    });

    const topIssuedWithDetails = topIssuedItems.map((item) => {
      const itemDetail = items.find((i) => i.id === item.itemId);
      return {
        ...item,
        itemCode: itemDetail?.itemCode,
        itemName: itemDetail?.itemName,
        unit: itemDetail?.unit,
      };
    });

    return NextResponse.json({
      summary: {
        totalInventoryValue: inventoryValue._sum.totalValue || 0,
        totalItems,
        totalSuppliers,
        lowStockCount,
        nearExpiryCount,
        expiredCount,
        alertsCount: lowStockCount + nearExpiryCount + expiredCount,
      },
      recentActivity: {
        stockInsLast30Days: recentStockIns,
        stockOutsLast30Days: recentStockOuts,
      },
      topItems: {
        byValue: topItemsByValue,
        byIssue: topIssuedWithDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
