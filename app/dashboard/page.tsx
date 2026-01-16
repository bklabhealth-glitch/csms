import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/dashboard/stats`,
      {
        headers: {
          Cookie: `next-auth.session-token=${session}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}

async function getRecentTransactions() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/dashboard/recent-transactions?limit=10`,
      {
        headers: {
          Cookie: `next-auth.session-token=${session}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getDashboardStats();
  const transactions = await getRecentTransactions();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-cyan-100 mt-1">
          ยินดีต้อนรับ, {session?.user?.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="มูลค่าสินค้าคงเหลือ"
          value={`฿${stats?.totalInventoryValue?.toLocaleString() || "0"}`}
          description="มูลค่ารวมของสินค้าทั้งหมด"
          icon={Package}
          gradient="from-violet-500 to-purple-500"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KpiCard
          title="สินค้าใกล้หมด"
          value={stats?.lowStockCount || 0}
          description="สินค้าที่ต่ำกว่าระดับขั้นต่ำ"
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-500"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="รับเข้าวันนี้"
          value={stats?.todayStockIn || 0}
          description="รายการรับเข้าวันนี้"
          icon={TrendingUp}
          gradient="from-emerald-500 to-green-500"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="เบิกออกวันนี้"
          value={stats?.todayStockOut || 0}
          description="รายการเบิกออกวันนี้"
          icon={TrendingDown}
          gradient="from-rose-500 to-pink-500"
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
}
