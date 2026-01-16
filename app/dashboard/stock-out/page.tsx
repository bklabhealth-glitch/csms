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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Eye, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface StockOut {
  id: string;
  stockOutNo: string;
  item: {
    itemCode: string;
    itemName: string;
    unit: string;
  };
  lotNo: string;
  quantityOut: number;
  purpose: string;
  requestDept: string;
  requestBy: string;
  outDate: Date;
  status: string;
  creator: {
    name: string;
  };
}

export default function StockOutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch stock outs
  const fetchStockOuts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "50");

      const response = await fetch(`/api/stock-out?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch stock outs");

      const data = await response.json();
      setStockOuts(data.stockOuts || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลเบิกสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockOuts();
  }, [searchTerm]);

  const handleApprove = async (id: string, stockOutNo: string) => {
    if (
      !confirm(
        `ต้องการอนุมัติเบิกสินค้า "${stockOutNo}" ใช่หรือไม่?\n\nการอนุมัติจะหักยอดคงเหลือในระบบ`
      )
    )
      return;

    try {
      const response = await fetch(`/api/stock-out/${id}/approve`, {
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

      fetchStockOuts();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถอนุมัติได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">เบิกสินค้าออก (Stock Out)</h1>
          <p className="text-muted-foreground">บันทึกการเบิกสินค้าออกจากคลัง</p>
        </div>
        <Button onClick={() => router.push("/dashboard/stock-out/new")}>
          <Plus className="mr-2 h-4 w-4" />
          บันทึกเบิกสินค้าใหม่
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
              placeholder="ค้นหาเลขที่เบิก, ชื่อสินค้า, Lot No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock Out Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="กำลังโหลดข้อมูล..." />
            </div>
          ) : stockOuts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูลเบิกสินค้าออก
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่เบิก</TableHead>
                    <TableHead>วันที่เบิก</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>Lot No.</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead>วัตถุประสงค์</TableHead>
                    <TableHead>แผนก/ผู้ขอเบิก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockOuts.map((stockOut) => (
                    <TableRow key={stockOut.id}>
                      <TableCell className="font-medium">
                        {stockOut.stockOutNo}
                      </TableCell>
                      <TableCell>
                        {format(new Date(stockOut.outDate), "d MMM yyyy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {stockOut.item.itemName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stockOut.item.itemCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{stockOut.lotNo}</TableCell>
                      <TableCell className="text-right">
                        {stockOut.quantityOut} {stockOut.item.unit}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{stockOut.purpose}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {stockOut.requestDept || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stockOut.requestBy || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={stockOut.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/stock-out/${stockOut.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {stockOut.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleApprove(stockOut.id, stockOut.stockOutNo)
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
