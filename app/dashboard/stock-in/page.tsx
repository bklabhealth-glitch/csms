"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Eye, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface StockIn {
  id: string;
  stockInNo: string;
  item: {
    itemCode: string;
    itemName: string;
    unit: string;
  };
  lotNo: string;
  expiryDate: Date;
  quantityIn: number;
  unitPrice: number;
  totalValue: number;
  supplier: {
    supplierCode: string;
    companyName: string;
  };
  importDate: Date;
  status: string;
  creator: {
    name: string;
  };
}

export default function StockInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch stock ins
  const fetchStockIns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "50");

      const response = await fetch(`/api/stock-in?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch stock ins");

      const data = await response.json();
      setStockIns(data.stockIns || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรับสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockIns();
  }, [searchTerm]);

  const handleConfirm = async (id: string, stockInNo: string) => {
    if (!confirm(`ต้องการยืนยันรับสินค้า "${stockInNo}" ใช่หรือไม่?\n\nการยืนยันจะอัพเดทยอดคงเหลือในระบบ`))
      return;

    try {
      const response = await fetch(`/api/stock-in/${id}/confirm`, {
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

      fetchStockIns();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถยืนยันได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">รับสินค้าเข้า (Stock In)</h1>
          <p className="text-muted-foreground">
            บันทึกการรับสินค้าเข้าคลัง
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/stock-in/new")}>
          <Plus className="mr-2 h-4 w-4" />
          บันทึกรับสินค้าใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขที่รับเข้า, ชื่อสินค้า, Lot No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock In Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="กำลังโหลดข้อมูล..." />
            </div>
          ) : stockIns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลรับสินค้าเข้า
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่รับเข้า</TableHead>
                    <TableHead>วันที่รับเข้า</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>Lot No.</TableHead>
                    <TableHead>วันหมดอายุ</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead>ซัพพลายเออร์</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockIns.map((stockIn) => (
                    <TableRow key={stockIn.id}>
                      <TableCell className="font-medium">
                        {stockIn.stockInNo}
                      </TableCell>
                      <TableCell>
                        {format(new Date(stockIn.importDate), "d MMM yyyy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {stockIn.item.itemName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stockIn.item.itemCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{stockIn.lotNo}</TableCell>
                      <TableCell>
                        {format(new Date(stockIn.expiryDate), "d MMM yyyy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {stockIn.quantityIn} {stockIn.item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        ฿{stockIn.totalValue?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {stockIn.supplier?.companyName || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={stockIn.status as "DRAFT" | "CONFIRMED" | "APPROVED" | "CANCELLED"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/stock-in/${stockIn.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {stockIn.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleConfirm(stockIn.id, stockIn.stockInNo)
                              }
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
