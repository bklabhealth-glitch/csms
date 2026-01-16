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

export default function StockOutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [stockOut, setStockOut] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const stockOutId = params.id as string;

  // Fetch stock out data
  useEffect(() => {
    const fetchStockOut = async () => {
      try {
        const response = await fetch(`/api/stock-out/${stockOutId}`);
        if (!response.ok) throw new Error("Failed to fetch stock out");

        const data = await response.json();
        setStockOut(data);
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลเบิกสินค้าได้",
          variant: "destructive",
        });
        router.push("/dashboard/stock-out");
      } finally {
        setLoading(false);
      }
    };

    fetchStockOut();
  }, [stockOutId]);

  const handleApprove = async () => {
    if (
      !confirm(
        "ต้องการอนุมัติเบิกสินค้านี้ใช่หรือไม่?\n\nการอนุมัติจะหักยอดคงเหลือในระบบ"
      )
    )
      return;

    setApproving(true);

    try {
      const response = await fetch(`/api/stock-out/${stockOutId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve stock out");
      }

      toast({
        title: "สำเร็จ",
        description: "อนุมัติเบิกสินค้าเรียบร้อยแล้ว",
      });

      // Refresh data
      const refreshResponse = await fetch(`/api/stock-out/${stockOutId}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setStockOut(data);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถอนุมัติได้",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!stockOut) {
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
            <h1 className="text-3xl font-bold">รายละเอียดเบิกสินค้าออก</h1>
            <p className="text-muted-foreground">{stockOut.stockOutNo}</p>
          </div>
        </div>

        {stockOut.status === "DRAFT" && (
          <Button onClick={handleApprove} disabled={approving}>
            {approving ? (
              <>กำลังอนุมัติ...</>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                อนุมัติเบิกสินค้า
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
                <StatusBadge status={stockOut.status} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">เลขที่เบิก</div>
              <div className="font-medium">{stockOut.stockOutNo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">วันที่เบิก</div>
              <div className="font-medium">
                {format(new Date(stockOut.outDate), "d MMMM yyyy", {
                  locale: th,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ผู้บันทึก</div>
              <div className="font-medium">{stockOut.creator.name}</div>
            </div>
            {stockOut.approveBy && (
              <div>
                <div className="text-sm text-muted-foreground">ผู้อนุมัติ</div>
                <div className="font-medium">{stockOut.approveBy}</div>
              </div>
            )}
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
              <div className="font-medium">{stockOut.item.itemCode}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ชื่อสินค้า</div>
              <div className="font-medium">{stockOut.item.itemName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">หมวดหมู่</div>
              <div className="font-medium">{stockOut.item.category}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">หน่วย</div>
              <div className="font-medium">{stockOut.item.unit}</div>
            </div>
          </CardContent>
        </Card>

        {/* Lot Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูล Lot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Lot Number</div>
              <div className="font-medium">{stockOut.lotNo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">จำนวนที่เบิก</div>
              <div className="font-medium text-lg text-blue-600">
                {stockOut.quantityOut} {stockOut.item.unit}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการขอเบิก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">วัตถุประสงค์</div>
              <div className="font-medium">{stockOut.purpose}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">แผนกที่ขอเบิก</div>
              <div className="font-medium">{stockOut.requestDept || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ผู้ขอเบิก</div>
              <div className="font-medium">{stockOut.requestBy || "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Remark */}
        {stockOut.remarkOut && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{stockOut.remarkOut}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
