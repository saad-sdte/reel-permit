import { DashboardView } from "@/components/admin/panel";
import { mongoDashboardBundle } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Server-fetch so first paint has real data — no client skeleton flash.
  const bundle = await mongoDashboardBundle({ limit: 10 }).catch(() => null);
  if (!bundle) {
    return <DashboardView />;
  }
  const { orders, ...stats } = bundle;
  return <DashboardView initialStats={stats} initialOrders={orders} />;
}
