import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "NORMAL" | "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED" | "ACTIVE" | "INACTIVE" | "DRAFT" | "CONFIRMED" | "APPROVED" | "CANCELLED";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    // Stock Balance Status
    NORMAL: {
      label: "ปกติ",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    LOW_STOCK: {
      label: "ใกล้หมด",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    },
    NEAR_EXPIRY: {
      label: "ใกล้หมดอายุ",
      className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    },
    EXPIRED: {
      label: "หมดอายุ",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
    // General Status
    ACTIVE: {
      label: "ใช้งาน",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    INACTIVE: {
      label: "ไม่ใช้งาน",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    },
    // Transaction Status
    DRAFT: {
      label: "แบบร่าง",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    },
    CONFIRMED: {
      label: "ยืนยันแล้ว",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    APPROVED: {
      label: "อนุมัติแล้ว",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    CANCELLED: {
      label: "ยกเลิก",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
  };

  const variant = variants[status];

  return (
    <Badge className={cn(variant.className, className)}>
      {variant.label}
    </Badge>
  );
}
