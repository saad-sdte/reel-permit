import { ApplicationDetailView } from "@/components/admin/panel";

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ApplicationDetailView id={params.id} />;
}
