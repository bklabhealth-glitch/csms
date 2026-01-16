"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Transaction {
  type: "STOCK_IN" | "STOCK_OUT";
  id: string;
  transactionNo: string;
  item: {
    itemCode: string;
    itemName: string;
    unit: string;
  };
  quantity: number;
  lotNo: string;
  date: Date;
  performedBy: string;
  status: string;
  purpose?: string;
  requestDept?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการเคลื่อนไหวล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              ไม่มีรายการเคลื่อนไหว
            </p>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start gap-4 rounded-lg border p-3"
              >
                <div
                  className={`rounded-full p-2 ${
                    transaction.type === "STOCK_IN"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {transaction.type === "STOCK_IN" ? (
                    <ArrowDownToLine className="h-4 w-4" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {transaction.item.itemName}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.transactionNo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transaction.type === "STOCK_IN" ? "รับเข้า" : "เบิกออก"}{" "}
                    {transaction.quantity} {transaction.item.unit} | Lot:{" "}
                    {transaction.lotNo}
                  </p>
                  {transaction.purpose && (
                    <p className="text-xs text-muted-foreground">
                      {transaction.purpose} - {transaction.requestDept}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}{" "}
                    โดย {transaction.performedBy}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
