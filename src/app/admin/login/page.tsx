import { redirect } from "next/navigation";
import { adminAuthConfigured, isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureBootstrapAdmin } from "@/lib/admin-users";
import { AdminLoginForm } from "@/components/admin/panel";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  await ensureBootstrapAdmin();

  if (!adminAuthConfigured()) {
    return (
      <div className="admin-root" style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div className="admin-card" style={{ padding: "2rem", maxWidth: 480 }}>
          <h1 className="admin-title" style={{ fontSize: "1.4rem" }}>
            Admin not configured
          </h1>
          <p className="admin-sub">
            Set <code>ADMIN_PANEL_SECRET</code> (session signing, min 8 chars) and{" "}
            <code>MONGODB_URI</code>, then reload.
          </p>
        </div>
      </div>
    );
  }

  return <AdminLoginForm />;
}
