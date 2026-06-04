import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ReportsTable } from "@/components/ReportsTable";
import { QuickShortcuts } from "@/components/QuickShortcuts";
import type { ReportWithCategory } from "@/types/app";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const month = params.month;
  let query = supabase
    .from("reports")
    .select("*, activity_categories(name)")
    .eq("user_id", user.id)
    .order("tanggal", { ascending: false });

  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const start = `${year}-${`${monthNumber}`.padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNumber, 0);
    const end = `${year}-${`${monthNumber}`.padStart(2, "0")}-${`${endDate.getDate()}`.padStart(2, "0")}`;
    query = query.gte("tanggal", start).lte("tanggal", end);
  }

  const { data } = await query;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Laporan</h1>
          <p className="page-subtitle">Kelola laporan harian dan export data.</p>
        </div>
        <Link className="btn btn-primary icon-btn" href="/reports/new">
          <Plus size={18} /> Laporan Baru
        </Link>
      </div>

      <QuickShortcuts current="reports" />

      <form className="panel mb-3" action="/reports">
        <div className="panel-body row g-3 align-items-end">
          <div className="col-sm-6 col-md-4">
            <label className="form-label" htmlFor="month">
              Filter bulan
            </label>
            <input className="form-control" id="month" name="month" type="month" defaultValue={month} />
          </div>
          <div className="col-sm-auto">
            <button className="btn btn-outline-primary" type="submit">
              Terapkan
            </button>
          </div>
          <div className="col-sm-auto">
            <Link className="btn btn-outline-secondary" href="/reports">
              Reset
            </Link>
          </div>
        </div>
      </form>

      <ReportsTable reports={(data ?? []) as ReportWithCategory[]} />
    </div>
  );
}
