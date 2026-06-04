import { requireUser } from "@/lib/auth";
import { ReportForm } from "@/components/ReportForm";
import { QuickShortcuts } from "@/components/QuickShortcuts";
import type { ActivityCategory } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const { supabase } = await requireUser();
  const { data: categories } = await supabase
    .from("activity_categories")
    .select("id,name,created_at")
    .order("name", { ascending: true });

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Baru</h1>
          <p className="page-subtitle">Isi kegiatan harian sesuai kondisi sebenarnya.</p>
        </div>
      </div>
      <QuickShortcuts current="new-report" />
      <ReportForm categories={(categories ?? []) as ActivityCategory[]} />
    </div>
  );
}
