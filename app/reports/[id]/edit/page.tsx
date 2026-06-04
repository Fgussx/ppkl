import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ReportForm } from "@/components/ReportForm";
import { QuickShortcuts } from "@/components/QuickShortcuts";
import type { ActivityCategory, Report } from "@/types/app";

export const dynamic = "force-dynamic";

type EditReportPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditReportPage({ params }: EditReportPageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: categories }, { data: report }] = await Promise.all([
    supabase.from("activity_categories").select("id,name,created_at").order("name", { ascending: true }),
    supabase.from("reports").select("*").eq("id", id).eq("user_id", user.id).single()
  ]);

  if (!report) {
    notFound();
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Laporan</h1>
          <p className="page-subtitle">Perbarui data laporan yang sudah tersimpan.</p>
        </div>
      </div>
      <QuickShortcuts current="reports" />
      <ReportForm
        categories={(categories ?? []) as ActivityCategory[]}
        report={report as Report}
      />
    </div>
  );
}
