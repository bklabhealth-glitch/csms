"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  FileText,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "สินค้า",
    href: "/dashboard/items",
    icon: Package,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "ซัพพลายเออร์",
    href: "/dashboard/suppliers",
    icon: Building2,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "รับเข้า (Stock In)",
    href: "/dashboard/stock-in",
    icon: ArrowDownToLine,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "เบิกออก (Stock Out)",
    href: "/dashboard/stock-out",
    icon: ArrowUpFromLine,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "คงเหลือ",
    href: "/dashboard/stock-balance",
    icon: Box,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "รายงาน",
    href: "/dashboard/reports",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gradient-to-b from-slate-50 to-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-cyan-500 to-teal-500">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Box className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl text-white font-bold">CSMS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? `${item.bgColor} ${item.color} shadow-sm`
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isActive ? item.bgColor : "bg-slate-100"
              )}>
                <Icon className={cn("h-4 w-4", isActive ? item.color : "text-slate-500")} />
              </div>
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Settings className="h-4 w-4 text-slate-500" />
          </div>
          ตั้งค่า
        </Link>
      </div>
    </div>
  );
}
