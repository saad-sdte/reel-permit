import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { AdminSessionProvider } from "@/components/admin/admin-theme";
import { AdminShell } from "@/components/admin/panel";
import { warmMongo } from "@/lib/mongo";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const me = await getAdminSessionUser();
  if (!me) redirect("/admin/login");
  // Fire-and-forget warm so subsequent API/page Mongo calls reuse the pool.
  void warmMongo();
  return (
    <AdminSessionProvider initialMe={me}>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
