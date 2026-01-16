import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  gradient?: string;
  iconBg?: string;
  iconColor?: string;
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  gradient = "from-gray-500 to-gray-600",
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
}: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardContent className="p-0">
        {/* Gradient Header */}
        <div className={cn("bg-gradient-to-r p-4", gradient)}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/90">{title}</p>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}% จากเดือนที่แล้ว
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
