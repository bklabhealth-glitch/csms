import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvailableLots } from "@/lib/balance-calculator";

// GET /api/stock-out/lots?itemId=xxx - ดึงรายการ Lots ที่สามารถเบิกได้ (FEFO)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "กรุณาระบุ itemId" },
        { status: 400 }
      );
    }

    // Get available lots sorted by FEFO
    const lots = await getAvailableLots(itemId);

    return NextResponse.json({
      itemId,
      lots,
      total: lots.length,
    });
  } catch (error) {
    console.error("Error fetching available lots:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล Lots" },
      { status: 500 }
    );
  }
}
