import Link from "next/link";
import { Plus, Settings, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { calculateReportStats } from "@/lib/reports";
import {
  formatDate,
  getRollingSixMonthRange,
  statusLabel,
  toMonthInputValue
} from "@/lib/format";
import { DashboardCharts } from "@/components/DashboardCharts";
import { QuickShortcuts } from "@/components/QuickShortcuts";
import type { ReportWithCategory } from "@/types/app";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string }>;
};

type RoleBadgeProps = {
  role: "admin" | "user";
};

function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`badge role-badge ${role === "admin" ? "role-badge-admin" : "role-badge-user"}`}>
      {role === "admin" ? "ADMIN" : "USER"}
    </span>
  );
}

function StatsGrid({
  stats,
  userCount
}: {
  stats: ReturnType<typeof calculateReportStats>;
  userCount?: number | null;
}) {
  return (
    <section className="stat-grid mb-3" aria-label="Statistik laporan">
      {typeof userCount === "number" ? (
        <div className="stat-tile">
          <span className="stat-label">User</span>
          <strong className="stat-value">{userCount}</strong>
        </div>
      ) : null}
      <div className="stat-tile">
        <span className="stat-label">Total laporan</span>
        <strong className="stat-value">{stats.totalReports}</strong>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Hari aktif</span>
        <strong className="stat-value">{stats.activeDays}</strong>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Selesai</span>
        <strong className="stat-value">{stats.doneCount}</strong>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Belum selesai</span>
        <strong className="stat-value">{stats.pendingCount}</strong>
      </div>
    </section>
  );
}

function ActivityList({ reports }: { reports: ReportWithCategory[] }) {
  const stats = calculateReportStats(reports);

  return (
    <div className="panel h-100">
      <div className="panel-header">
        <h2 className="h5 mb-0">Kegiatan paling sering</h2>
      </div>
      <div className="panel-body">
        {stats.topActivities.length ? (
          <ol className="mb-0">
            {stats.topActivities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ol>
        ) : (
          <p className="text-secondary mb-0">Belum ada laporan.</p>
        )}
      </div>
    </div>
  );
}

function RecentReportsTable({
  reports,
  showUser
}: {
  reports: ReportWithCategory[];
  showUser: boolean;
}) {
  return (
    <div className="panel mt-3">
      <div className="panel-header">
        <h2 className="h5 mb-0">{showUser ? "Laporan terbaru semua user" : "Laporan saya"}</h2>
      </div>
      <div className="table-responsive">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Tanggal</th>
              {showUser ? <th>User</th> : null}
              <th>Kategori</th>
              <th>Kegiatan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.length ? (
              reports.map((report) => (
                <tr key={report.id}>
                  <td>{formatDate(report.tanggal)}</td>
                  {showUser ? (
                    <td>{report.profiles?.nama || report.profiles?.email || "-"}</td>
                  ) : null}
                  <td>{report.activity_categories?.name ?? "-"}</td>
                  <td>{report.kegiatan}</td>
                  <td>
                    <span
                      className={`badge ${
                        report.status === "selesai" ? "text-bg-success" : "text-bg-warning"
                      }`}
                    >
                      {statusLabel(report.status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center text-secondary py-4" colSpan={showUser ? 5 : 4}>
                  Belum ada laporan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const month = params.month ?? toMonthInputValue();
  const { startIso, endIso } = getRollingSixMonthRange(month);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,nama,email")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role === "admin" ? "admin" : "user";

  if (role === "admin") {
    const [{ data: reports }, { count: userCount }, { data: recentReports }] =
      await Promise.all([
        supabase
          .from("reports")
          .select("*, activity_categories(name), profiles(nama,email)")
          .gte("tanggal", startIso)
          .lte("tanggal", endIso)
          .order("tanggal", { ascending: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase
          .from("reports")
          .select("*, activity_categories(name), profiles(nama,email)")
          .order("tanggal", { ascending: false })
          .limit(8)
      ]);
    const adminReports = (reports ?? []) as ReportWithCategory[];
    const stats = calculateReportStats(adminReports);

    return (
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <RoleBadge role="admin" />
              <span className="text-secondary">Area kontrol semua laporan</span>
            </div>
            <h1 className="page-title">Dashboard Admin</h1>
            <p className="page-subtitle">Rekap semua user, laporan terbaru, dan konfigurasi sistem.</p>
          </div>
          <Link className="btn btn-outline-primary icon-btn" href="/admin/ai">
            <Settings size={18} /> Admin AI
          </Link>
        </div>

        <QuickShortcuts current="dashboard" />

        <section className="workspace-zone workspace-zone-admin" aria-label="Area admin">
          <div className="workspace-zone-header">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <RoleBadge role="admin" />
                <h2 className="workspace-zone-title">Area Admin</h2>
              </div>
              <p className="workspace-zone-note">
                Bagian ini untuk memantau semua user, semua laporan, dan konfigurasi sistem.
              </p>
            </div>
            <Link className="btn btn-outline-primary icon-btn" href="/admin/ai">
              <Settings size={18} /> Admin AI
            </Link>
          </div>

          <form className="panel mb-3" action="/dashboard">
            <div className="panel-body row g-3 align-items-end">
              <div className="col-sm-6 col-md-4">
                <label className="form-label" htmlFor="month">
                  Bulan akhir rekap
                </label>
                <input className="form-control" id="month" name="month" type="month" defaultValue={month} />
              </div>
              <div className="col-sm-auto">
                <button className="btn btn-outline-primary" type="submit">
                  Terapkan
                </button>
              </div>
            </div>
          </form>

          <StatsGrid stats={stats} userCount={userCount ?? 0} />

          <div className="row g-3">
            <div className="col-lg-7">
              <div className="panel h-100">
                <div className="panel-header">
                  <h2 className="h5 mb-0">Grafik semua laporan</h2>
                </div>
                <div className="panel-body">
                  <DashboardCharts data={stats.monthly} />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <ActivityList reports={adminReports} />
            </div>
          </div>

          <RecentReportsTable reports={(recentReports ?? []) as ReportWithCategory[]} showUser />
        </section>
      </div>
    );
  }

  const [{ data: reports }, { data: recentReports }] = await Promise.all([
    supabase
      .from("reports")
      .select("*, activity_categories(name)")
      .eq("user_id", user.id)
      .gte("tanggal", startIso)
      .lte("tanggal", endIso)
      .order("tanggal", { ascending: true }),
    supabase
      .from("reports")
      .select("*, activity_categories(name)")
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false })
      .limit(8)
  ]);
  const userReports = (reports ?? []) as ReportWithCategory[];
  const stats = calculateReportStats(userReports);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <RoleBadge role="user" />
            <span className="text-secondary">Area laporan pribadi</span>
          </div>
          <h1 className="page-title">Workspace User</h1>
          <p className="page-subtitle">Kelola laporan harian, AI Tools, dan rekap pribadi.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-primary icon-btn" href="/ai-tools">
            <Sparkles size={18} /> AI Tools
          </Link>
          <Link className="btn btn-primary icon-btn" href="/reports/new">
            <Plus size={18} /> Laporan Baru
          </Link>
        </div>
      </div>

      <section className="workspace-zone workspace-zone-user" aria-label="Area user">
        <div className="workspace-zone-header">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <RoleBadge role="user" />
              <h2 className="workspace-zone-title">Area User</h2>
            </div>
            <p className="workspace-zone-note">
              Bagian ini hanya menampilkan laporan milik akun yang sedang login.
            </p>
          </div>
        </div>

        <form className="panel mb-3" action="/dashboard">
          <div className="panel-body row g-3 align-items-end">
            <div className="col-sm-6 col-md-4">
              <label className="form-label" htmlFor="month">
                Bulan akhir rekap
              </label>
              <input className="form-control" id="month" name="month" type="month" defaultValue={month} />
            </div>
            <div className="col-sm-auto">
              <button className="btn btn-outline-primary" type="submit">
                Terapkan
              </button>
            </div>
          </div>
        </form>

        <StatsGrid stats={stats} />

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="panel h-100">
              <div className="panel-header">
                <h2 className="h5 mb-0">Grafik laporan pribadi</h2>
              </div>
              <div className="panel-body">
                <DashboardCharts data={stats.monthly} />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <ActivityList reports={userReports} />
          </div>
        </div>

        <RecentReportsTable reports={(recentReports ?? []) as ReportWithCategory[]} showUser={false} />
      </section>
    </div>
  );
}
