"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { ExportButton } from "@/components/export-button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ITEM_CATEGORIES } from "@/lib/constants";

export default function BalanceReportPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/reports/balance?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to generate report");

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    const params = new URLSearchParams();
    if (categoryFilter !== "ALL") params.append("category", categoryFilter);
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    params.append("export", format);

    const response = await fetch(`/api/reports/balance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to export");

    // For now, just show message (export functionality to be implemented in Phase 2)
    const data = await response.json();
    throw new Error(data.message || "Export feature coming in Phase 2");
  };

  const getCategoryLabel = (category: string) => {
    const cat = ITEM_CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">รายงานยอดคงเหลือคลัง</h1>
          <p className="text-muted-foreground">
            รายงานสินค้าคงเหลือแยกตาม Lot และหมวดหมู่
          </p>
        </div>
        {reportData && <ExportButton onExport={handleExport} />}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองรายงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                {ITEM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                <SelectItem value="NORMAL">ปกติ</SelectItem>
                <SelectItem value="LOW_STOCK">ใกล้หมด</SelectItem>
                <SelectItem value="NEAR_EXPIRY">ใกล้หมดอายุ</SelectItem>
              </SelectContent>
            </Select>

            {/* Generate Button */}
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <>กำลังสร้างรายงาน...</>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  สร้างรายงาน
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="กำลังสร้างรายงาน..." />
        </div>
      )}

      {/* Report Results */}
      {reportData && !loading && (
        <>
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลรายงาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">สร้างเมื่อ:</span>
                <span className="font-medium">
                  {format(
                    new Date(reportData.generatedAt),
                    "d MMMM yyyy HH:mm น.",
                    { locale: th }
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ผู้สร้าง:</span>
                <span className="font-medium">{reportData.generatedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">หมวดหมู่:</span>
                <span className="font-medium">{reportData.filters.category}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  จำนวน Lot ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  มูลค่ารวมทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ฿{reportData.summary.totalValue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  จำนวนรวม (หน่วยต่างกัน)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalQuantity.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัสสินค้า</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>หมวดหมู่</TableHead>
                        <TableHead>Lot No.</TableHead>
                        <TableHead>วันหมดอายุ</TableHead>
                        <TableHead>ตำแหน่ง</TableHead>
                        <TableHead className="text-right">คงเหลือ</TableHead>
                        <TableHead className="text-right">มูลค่า</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.itemCode}
                          </TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>
                            {getCategoryLabel(item.category)}
                          </TableCell>
                          <TableCell>{item.lotNo}</TableCell>
                          <TableCell>
                            {format(
                              new Date(item.expiryDate),
                              "d MMM yyyy",
                              { locale: th }
                            )}
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell className="text-right">
                            {item.quantityBalance} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{item.totalValue?.toLocaleString() || "0"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status as "NORMAL" | "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED"} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
