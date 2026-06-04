import { requireAdmin } from "@/lib/auth";
import { AdminAiPanel } from "@/components/AdminAiPanel";
import { QuickShortcuts } from "@/components/QuickShortcuts";

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  await requireAdmin();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin AI</h1>
          <p className="page-subtitle">Provider aktif dipakai oleh semua fitur AI user.</p>
        </div>
      </div>
      <QuickShortcuts current="admin-ai" />
      <AdminAiPanel />
    </div>
  );
}
