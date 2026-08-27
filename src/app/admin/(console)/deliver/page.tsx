import { Suspense } from "react";
import { DeliverView } from "@/components/admin/deliver-view";

export default function DeliverLicensePage() {
  return (
    <Suspense fallback={<p className="admin-sub">Loading deliver form…</p>}>
      <DeliverView />
    </Suspense>
  );
}
