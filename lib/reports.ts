import type { ReportWithCategory } from "@/types/app";

export type ReportStats = {
  totalReports: number;
  activeDays: number;
  issueCount: number;
  doneCount: number;
  pendingCount: number;
  topActivities: string[];
  monthly: Array<{ month: string; total: number }>;
};

export function calculateReportStats(reports: ReportWithCategory[]): ReportStats {
  const activeDays = new Set(reports.map((report) => report.tanggal)).size;
  const issueCount = reports.filter((report) => report.kendala?.trim()).length;
  const doneCount = reports.filter((report) => report.status === "selesai").length;
  const pendingCount = reports.length - doneCount;
  const activityCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();

  reports.forEach((report) => {
    const category = report.activity_categories?.name ?? "Tanpa kategori";
    activityCounts.set(category, (activityCounts.get(category) ?? 0) + 1);

    const month = report.tanggal.slice(0, 7);
    monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
  });

  const topActivities = [...activityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const monthly = [...monthlyCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  return {
    totalReports: reports.length,
    activeDays,
    issueCount,
    doneCount,
    pendingCount,
    topActivities,
    monthly
  };
}
