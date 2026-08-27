import { redirect } from "next/navigation";
import { adminAuthConfigured, isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureBootstrapAdmin } from "@/lib/admin-users";
import { AdminLoginForm } from "@/components/admin/panel";
import { adminPath } from "@/lib/admin-paths";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect(adminPath());
  await ensureBootstrapAdmin();

  if (!adminAuthConfigured()) {
    return (
      <div className="admin-root admin-login-wrap">
        <div className="admin-login-card">
          <p className="admin-login-wordmark">
            Reel<span>Permit</span>
          </p>
          <h1 className="admin-login-title">Control panel is not configured</h1>
          <p className="admin-login-lede">
            Set <code>ADMIN_PANEL_SECRET</code> (session signing, min 8 chars) and{" "}
            <code>MONGODB_URI</code>, then reload. Database name should be{" "}
            <code>reelpermit</code>.
          </p>
        </div>
      </div>
    );
  }

  return <AdminLoginForm />;
}
