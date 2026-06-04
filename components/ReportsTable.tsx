"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDate, statusLabel } from "@/lib/format";
import type { ReportWithCategory } from "@/types/app";

type ReportsTableProps = {
  reports: ReportWithCategory[];
};

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      reports.map((report) => ({
        Tanggal: formatDate(report.tanggal),
        Kategori: report.activity_categories?.name ?? "-",
        Kegiatan: report.kegiatan,
        Kendala: report.kendala ?? "-",
        Solusi: report.solusi ?? "-",
        Status: statusLabel(report.status)
      })),
    [reports]
  );

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, "laporan-harian.xlsx");
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text("Laporan Harian", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Tanggal", "Kategori", "Kegiatan", "Kendala", "Solusi", "Status"]],
      body: rows.map((row) => [
        row.Tanggal,
        row.Kategori,
        row.Kegiatan,
        row.Kendala,
        row.Solusi,
        row.Status
      ]),
      styles: { fontSize: 8, cellPadding: 2 }
    });
    doc.save("laporan-harian.pdf");
  }

  async function deleteReport(id: string) {
    const confirmed = window.confirm("Hapus laporan ini?");

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        window.alert(body.error ?? "Laporan gagal dihapus.");
        return;
      }

      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 className="h5 mb-0">Laporan tersimpan</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary icon-btn" type="button" onClick={exportExcel}>
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button className="btn btn-outline-secondary icon-btn" type="button" onClick={exportPdf}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Kegiatan</th>
              <th>Status</th>
              <th>Dokumentasi</th>
              <th className="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.length ? (
              reports.map((report) => (
                <tr key={report.id}>
                  <td>{formatDate(report.tanggal)}</td>
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
                  <td>{report.dokumentasi_path ? "Ada" : "-"}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <Link className="btn btn-sm btn-outline-primary" href={`/reports/${report.id}/edit`}>
                        <Pencil size={16} />
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        type="button"
                        disabled={deletingId === report.id}
                        onClick={() => void deleteReport(report.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center text-secondary py-4" colSpan={6}>
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
