import { Suspense } from "react";
import { ApplicationsView } from "@/components/admin/panel";

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<p className="admin-sub">Loading applications…</p>}>
      <ApplicationsView />
    </Suspense>
  );
}
