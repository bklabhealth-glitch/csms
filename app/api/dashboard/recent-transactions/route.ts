import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/recent-transactions - ดึงรายการ transactions ล่าสุด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get recent stock ins
    const recentStockIns = await prisma.stockIn.findMany({
      where: {
        status: "CONFIRMED",
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
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        importDate: "desc",
      },
      take: limit,
    });

    // Get recent stock outs
    const recentStockOuts = await prisma.stockOut.findMany({
      where: {
        status: "APPROVED",
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
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        outDate: "desc",
      },
      take: limit,
    });

    // Combine and sort by date
    const allTransactions = [
      ...recentStockIns.map((t) => ({
        type: "STOCK_IN" as const,
        id: t.id,
        transactionNo: t.stockInNo,
        item: t.item,
        quantity: t.quantityIn,
        lotNo: t.lotNo,
        date: t.importDate,
        performedBy: t.creator.name,
        status: t.status,
      })),
      ...recentStockOuts.map((t) => ({
        type: "STOCK_OUT" as const,
        id: t.id,
        transactionNo: t.stockOutNo,
        item: t.item,
        quantity: t.quantityOut,
        lotNo: t.lotNo,
        date: t.outDate,
        performedBy: t.creator.name,
        purpose: t.purpose,
        requestDept: t.requestDept,
        status: t.status,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({
      transactions: allTransactions.slice(0, limit),
      total: allTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
