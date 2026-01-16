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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ExportButton } from "@/components/export-button";
import { DateRangePicker } from "@/components/date-range-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";

export default function MovementsReportPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const generateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "กรุณาเลือกช่วงวันที่",
        description: "โปรดเลือกวันที่เริ่มต้นและสิ้นสุด",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("dateFrom", dateRange.from.toISOString());
      params.append("dateTo", dateRange.to.toISOString());
      if (typeFilter !== "ALL") params.append("type", typeFilter);

      const response = await fetch(
        `/api/reports/movements?${params.toString()}`
      );
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
    if (!dateRange?.from || !dateRange?.to) return;

    const params = new URLSearchParams();
    params.append("dateFrom", dateRange.from.toISOString());
    params.append("dateTo", dateRange.to.toISOString());
    if (typeFilter !== "ALL") params.append("type", typeFilter);
    params.append("export", format);

    const response = await fetch(`/api/reports/movements?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to export");

    const data = await response.json();
    throw new Error(data.message || "Export feature coming in Phase 2");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">รายงานการเคลื่อนไหวสินค้า</h1>
          <p className="text-muted-foreground">
            รายงานการรับเข้าและเบิกออกตามช่วงเวลา
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
            {/* Date Range */}
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="IN">รับเข้า</SelectItem>
                <SelectItem value="OUT">เบิกออก</SelectItem>
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
                <span className="text-muted-foreground">ช่วงเวลา:</span>
                <span className="font-medium">
                  {format(new Date(reportData.filters.dateFrom), "d MMM yyyy", {
                    locale: th,
                  })}{" "}
                  -{" "}
                  {format(new Date(reportData.filters.dateTo), "d MMM yyyy", {
                    locale: th,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  จำนวนรายการทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalTransactions}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  รับเข้าทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.totalStockIn.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  เบิกออกทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.totalStockOut.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  มูลค่ารับเข้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ฿{reportData.summary.totalValueIn.toLocaleString()}
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
              {reportData.movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีข้อมูล
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>เลขที่</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>Lot No.</TableHead>
                        <TableHead className="text-right">จำนวน</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.movements.map((movement: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge
                              variant={
                                movement.type === "STOCK_IN"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                movement.type === "STOCK_IN"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }
                            >
                              {movement.type === "STOCK_IN" ? (
                                <>
                                  <ArrowDownToLine className="h-3 w-3 mr-1" />
                                  รับเข้า
                                </>
                              ) : (
                                <>
                                  <ArrowUpFromLine className="h-3 w-3 mr-1" />
                                  เบิกออก
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(movement.date), "d MMM yyyy", {
                              locale: th,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.transactionNo}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {movement.itemName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {movement.itemCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{movement.lotNo}</TableCell>
                          <TableCell className="text-right">
                            {movement.quantity} {movement.unit}
                          </TableCell>
                          <TableCell className="text-sm">
                            {movement.type === "STOCK_IN" ? (
                              <div>
                                ซัพพลายเออร์: {movement.supplier || "-"}
                              </div>
                            ) : (
                              <div>
                                {movement.purpose}
                                {movement.requestDept && (
                                  <> - {movement.requestDept}</>
                                )}
                              </div>
                            )}
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
