import { redirect } from "next/navigation";
import { adminAuthConfigured, isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureBootstrapAdmin } from "@/lib/admin-users";
import { AdminLoginForm, AdminLoginUnconfigured } from "@/components/admin/panel";
import { adminPath } from "@/lib/admin-paths";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect(adminPath());
  await ensureBootstrapAdmin();

  if (!adminAuthConfigured()) {
    return <AdminLoginUnconfigured />;
  }

  return <AdminLoginForm />;
}
