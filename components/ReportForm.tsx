"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AI_REPORT_DRAFT_STORAGE_KEY,
  normalizeCategoryName,
  type AiReportDraft
} from "@/lib/ai/report-draft";
import type { ActivityCategory, Report } from "@/types/app";

type ReportFormProps = {
  categories: ActivityCategory[];
  report?: Report;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readStoredAiDraft(report?: Report) {
  if (report || typeof window === "undefined") {
    return null;
  }

  const rawDraft = window.sessionStorage.getItem(AI_REPORT_DRAFT_STORAGE_KEY);

  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft) as Partial<AiReportDraft>;
  } catch {
    window.sessionStorage.removeItem(AI_REPORT_DRAFT_STORAGE_KEY);
    return null;
  }
}

export function ReportForm({ categories, report }: ReportFormProps) {
  const router = useRouter();
  const [storedDraft] = useState(() => readStoredAiDraft(report));
  const categoryName = normalizeCategoryName(String(storedDraft?.category_name ?? ""));
  const matchedCategory = categories.find(
    (category) => normalizeCategoryName(category.name) === categoryName
  );
  const [tanggal, setTanggal] = useState(report?.tanggal ?? today());
  const [activityCategoryId, setActivityCategoryId] = useState(
    report?.activity_category_id ?? matchedCategory?.id ?? ""
  );
  const [status, setStatus] = useState(
    report?.status ?? (storedDraft?.status === "selesai" ? "selesai" : "belum_selesai")
  );
  const [kegiatan, setKegiatan] = useState(report?.kegiatan ?? String(storedDraft?.kegiatan ?? ""));
  const [kendala, setKendala] = useState(report?.kendala ?? String(storedDraft?.kendala ?? ""));
  const [solusi, setSolusi] = useState(report?.solusi ?? String(storedDraft?.solusi ?? ""));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const notice = storedDraft
    ? "Draft dari AI sudah dimasukkan. Periksa lagi sebelum disimpan."
    : "";

  useEffect(() => {
    if (storedDraft) {
      window.sessionStorage.removeItem(AI_REPORT_DRAFT_STORAGE_KEY);
    }
  }, [storedDraft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const endpoint = report ? `/api/reports/${report.id}` : "/api/reports";
    const method = report ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        body: formData
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body.error ?? "Laporan gagal disimpan.");
        return;
      }

      router.push("/reports");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laporan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-body">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" htmlFor="tanggal">
              Tanggal
            </label>
            <input
              className="form-control"
              id="tanggal"
              name="tanggal"
              type="date"
              value={tanggal}
              onChange={(event) => setTanggal(event.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="activity_category_id">
              Kategori
            </label>
            <select
              className="form-select"
              id="activity_category_id"
              name="activity_category_id"
              value={activityCategoryId}
              onChange={(event) => setActivityCategoryId(event.target.value)}
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="status">
              Status
            </label>
            <select
              className="form-select"
              id="status"
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value === "selesai" ? "selesai" : "belum_selesai")
              }
              required
            >
              <option value="selesai">Selesai</option>
              <option value="belum_selesai">Belum selesai</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="kegiatan">
              Kegiatan
            </label>
            <textarea
              className="form-control"
              id="kegiatan"
              name="kegiatan"
              rows={5}
              value={kegiatan}
              onChange={(event) => setKegiatan(event.target.value)}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="kendala">
              Kendala
            </label>
            <textarea
              className="form-control"
              id="kendala"
              name="kendala"
              rows={4}
              value={kendala}
              onChange={(event) => setKendala(event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="solusi">
              Solusi
            </label>
            <textarea
              className="form-control"
              id="solusi"
              name="solusi"
              rows={4}
              value={solusi}
              onChange={(event) => setSolusi(event.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="dokumentasi">
              Dokumentasi
            </label>
            <input
              className="form-control"
              id="dokumentasi"
              name="dokumentasi"
              type="file"
              accept="image/*"
            />
          </div>
        </div>

        {notice ? <div className="alert alert-info mt-3 mb-0">{notice}</div> : null}
        {message ? <div className="alert alert-danger mt-3 mb-0">{message}</div> : null}

        <div className="d-flex justify-content-end gap-2 mt-4">
          <Link className="btn btn-outline-secondary" href="/reports">
            Batal
          </Link>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </form>
  );
}
