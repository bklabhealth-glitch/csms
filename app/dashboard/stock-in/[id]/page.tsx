"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function StockInDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [stockIn, setStockIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const stockInId = params.id as string;

  // Fetch stock in data
  useEffect(() => {
    const fetchStockIn = async () => {
      try {
        const response = await fetch(`/api/stock-in/${stockInId}`);
        if (!response.ok) throw new Error("Failed to fetch stock in");

        const data = await response.json();
        setStockIn(data);
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรับสินค้าได้",
          variant: "destructive",
        });
        router.push("/dashboard/stock-in");
      } finally {
        setLoading(false);
      }
    };

    fetchStockIn();
  }, [stockInId]);

  const handleConfirm = async () => {
    if (!confirm("ต้องการยืนยันรับสินค้านี้ใช่หรือไม่?\n\nการยืนยันจะอัพเดทยอดคงเหลือในระบบ"))
      return;

    setConfirming(true);

    try {
      const response = await fetch(`/api/stock-in/${stockInId}/confirm`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm stock in");
      }

      toast({
        title: "สำเร็จ",
        description: "ยืนยันรับสินค้าเรียบร้อยแล้ว",
      });

      // Refresh data
      const refreshResponse = await fetch(`/api/stock-in/${stockInId}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setStockIn(data);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถยืนยันได้",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!stockIn) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold">รายละเอียดรับสินค้าเข้า</h1>
            <p className="text-muted-foreground">{stockIn.stockInNo}</p>
          </div>
        </div>

        {stockIn.status === "DRAFT" && (
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <>กำลังยืนยัน...</>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                ยืนยันรับสินค้า
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทั่วไป</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">สถานะ</div>
              <div className="mt-1">
                <StatusBadge status={stockIn.status as "DRAFT" | "CONFIRMED" | "APPROVED" | "CANCELLED"} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">เลขที่รับเข้า</div>
              <div className="font-medium">{stockIn.stockInNo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">วันที่รับเข้า</div>
              <div className="font-medium">
                {format(new Date(stockIn.importDate), "d MMMM yyyy", {
                  locale: th,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ผู้บันทึก</div>
              <div className="font-medium">{stockIn.creator.name}</div>
            </div>
          </CardContent>
        </Card>

        {/* Item Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลสินค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">รหัสสินค้า</div>
              <div className="font-medium">{stockIn.item.itemCode}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ชื่อสินค้า</div>
              <div className="font-medium">{stockIn.item.itemName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">หมวดหมู่</div>
              <div className="font-medium">{stockIn.item.category}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">หน่วย</div>
              <div className="font-medium">{stockIn.item.unit}</div>
            </div>
          </CardContent>
        </Card>

        {/* Lot & Expiry Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูล Lot และวันหมดอายุ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Lot Number</div>
              <div className="font-medium">{stockIn.lotNo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">วันหมดอายุ</div>
              <div className="font-medium">
                {format(new Date(stockIn.expiryDate), "d MMMM yyyy", {
                  locale: th,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ตำแหน่งจัดเก็บ</div>
              <div className="font-medium">
                {stockIn.storageLocation || "-"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Price */}
        <Card>
          <CardHeader>
            <CardTitle>จำนวนและมูลค่า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">จำนวนรับเข้า</div>
              <div className="font-medium text-lg">
                {stockIn.quantityIn} {stockIn.item.unit}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ราคาต่อหน่วย</div>
              <div className="font-medium">
                ฿{stockIn.unitPrice?.toLocaleString() || "0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">มูลค่ารวม</div>
              <div className="font-medium text-lg text-green-600">
                ฿{stockIn.totalValue?.toLocaleString() || "0"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลซัพพลายเออร์</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">รหัสซัพพลายเออร์</div>
              <div className="font-medium">
                {stockIn.supplier?.supplierCode || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ชื่อบริษัท</div>
              <div className="font-medium">
                {stockIn.supplier?.companyName || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">เลขที่ใบกำกับสินค้า</div>
              <div className="font-medium">{stockIn.invoiceNo || "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Remark */}
        {stockIn.remarkIn && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{stockIn.remarkIn}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
