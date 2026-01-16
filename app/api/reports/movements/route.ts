import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/movements - รายงานการเคลื่อนไหวสินค้า (Stock In/Out)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const itemId = searchParams.get("itemId");
    const type = searchParams.get("type"); // IN, OUT, or ALL
    const exportFormat = searchParams.get("export"); // csv, xlsx, pdf

    // Default: last 30 days
    const defaultDateTo = new Date();
    const defaultDateFrom = new Date();
    defaultDateFrom.setDate(defaultDateFrom.getDate() - 30);

    const fromDate = dateFrom ? new Date(dateFrom) : defaultDateFrom;
    const toDate = dateTo ? new Date(dateTo) : defaultDateTo;

    let stockIns: any[] = [];
    let stockOuts: any[] = [];

    // Get Stock Ins
    if (!type || type === "ALL" || type === "IN") {
      const stockInWhere: any = {
        importDate: {
          gte: fromDate,
          lte: toDate,
        },
        status: "CONFIRMED",
      };

      if (itemId) {
        stockInWhere.itemId = itemId;
      }

      stockIns = await prisma.stockIn.findMany({
        where: stockInWhere,
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
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          importDate: "desc",
        },
      });
    }

    // Get Stock Outs
    if (!type || type === "ALL" || type === "OUT") {
      const stockOutWhere: any = {
        outDate: {
          gte: fromDate,
          lte: toDate,
        },
        status: "APPROVED",
      };

      if (itemId) {
        stockOutWhere.itemId = itemId;
      }

      stockOuts = await prisma.stockOut.findMany({
        where: stockOutWhere,
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
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          outDate: "desc",
        },
      });
    }

    // Calculate summary
    const totalStockIn = stockIns.reduce((sum, s) => sum + s.quantityIn, 0);
    const totalStockOut = stockOuts.reduce((sum, s) => sum + s.quantityOut, 0);
    const totalValueIn = stockIns.reduce((sum, s) => sum + (s.totalValue || 0), 0);

    // Combine movements
    const movements = [
      ...stockIns.map((s) => ({
        type: "STOCK_IN",
        date: s.importDate,
        transactionNo: s.stockInNo,
        itemCode: s.item.itemCode,
        itemName: s.item.itemName,
        category: s.item.category,
        lotNo: s.lotNo,
        expiryDate: s.expiryDate,
        quantity: s.quantityIn,
        unit: s.item.unit,
        unitPrice: s.unitPrice,
        totalValue: s.totalValue,
        supplier: s.supplier?.companyName,
        invoiceNo: s.invoiceNo,
        location: s.storageLocation,
        performedBy: s.creator.name,
        remark: s.remarkIn,
      })),
      ...stockOuts.map((s) => ({
        type: "STOCK_OUT",
        date: s.outDate,
        transactionNo: s.stockOutNo,
        itemCode: s.item.itemCode,
        itemName: s.item.itemName,
        category: s.item.category,
        lotNo: s.lotNo,
        quantity: s.quantityOut,
        unit: s.item.unit,
        purpose: s.purpose,
        requestDept: s.requestDept,
        requestBy: s.requestBy,
        approveBy: s.approveBy,
        performedBy: s.creator.name,
        remark: s.remarkOut,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const reportData = {
      generatedAt: new Date(),
      generatedBy: session.user.name,
      filters: {
        dateFrom: fromDate,
        dateTo: toDate,
        itemId: itemId || "ทั้งหมด",
        type: type || "ทั้งหมด",
      },
      summary: {
        totalTransactions: movements.length,
        totalStockIn,
        totalStockOut,
        totalValueIn,
        netMovement: totalStockIn - totalStockOut,
      },
      movements,
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
    console.error("Error generating movements report:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรายงาน" },
      { status: 500 }
    );
  }
}
