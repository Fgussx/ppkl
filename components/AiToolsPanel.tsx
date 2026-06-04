"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clipboard,
  FilePlus2,
  Layers3,
  Lightbulb,
  ListChecks,
  Sparkles,
  Wand2
} from "lucide-react";
import { AI_FEATURE_LABELS } from "@/lib/ai/features";
import {
  AI_REPORT_DRAFT_STORAGE_KEY,
  parseAiDraftSections,
  parseReportStatus,
  type AiFeatureResults,
  type AiReportDraft
} from "@/lib/ai/report-draft";
import type { AiFeature } from "@/types/app";

type FeatureConfig = {
  key: AiFeature;
  endpoint: string;
  icon: React.ReactNode;
};

const FEATURES: FeatureConfig[] = [
  { key: "polish", endpoint: "/api/ai/polish", icon: <Wand2 size={18} /> },
  { key: "summarize", endpoint: "/api/ai/summarize", icon: <Clipboard size={18} /> },
  { key: "draft", endpoint: "/api/ai/draft", icon: <Sparkles size={18} /> },
  { key: "suggest_solution", endpoint: "/api/ai/suggest-solution", icon: <Lightbulb size={18} /> },
  { key: "categorize", endpoint: "/api/ai/categorize", icon: <ListChecks size={18} /> }
];

function needsSolution(text: string) {
  return /\b(kendala|masalah|error|solusi|bug|gagal|tidak bisa)\b/i.test(text);
}

function formatAllResults(results: AiFeatureResults, errors: AiFeatureResults) {
  return FEATURES.map((feature) => {
    const label = AI_FEATURE_LABELS[feature.key];
    const value = results[feature.key] || errors[feature.key] || "-";
    return `${label}:\n${value}`;
  }).join("\n\n");
}

export function AiToolsPanel() {
  const router = useRouter();
  const [feature, setFeature] = useState<FeatureConfig>(FEATURES[0]);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [allResults, setAllResults] = useState<AiFeatureResults>({});
  const [allErrors, setAllErrors] = useState<AiFeatureResults>({});
  const [message, setMessage] = useState("");
  const [loadingMode, setLoadingMode] = useState<"single" | "all" | null>(null);
  const [resultMode, setResultMode] = useState<"single" | "all">("single");

  const hasResult = useMemo(
    () =>
      Boolean(result.trim()) ||
      Object.values(allResults).some((value) => Boolean(value?.trim())),
    [allResults, result]
  );
  const loading = Boolean(loadingMode);

  async function requestFeature(item: FeatureConfig) {
    const response = await fetch(item.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error ?? "AI gagal memproses request.");
    }

    return String(body.result ?? "").trim();
  }

  async function runFeature() {
    if (!text.trim()) {
      setMessage("Teks laporan wajib diisi.");
      return;
    }

    setLoadingMode("single");
    setMessage("");
    setResult("");
    setAllResults({});
    setAllErrors({});
    setResultMode("single");

    try {
      setResult(await requestFeature(feature));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI gagal memproses request.");
    } finally {
      setLoadingMode(null);
    }
  }

  async function runAllFeatures() {
    if (!text.trim()) {
      setMessage("Teks laporan wajib diisi.");
      return;
    }

    setLoadingMode("all");
    setMessage("");
    setResult("");
    setAllResults({});
    setAllErrors({});
    setResultMode("all");

    const nextResults: AiFeatureResults = {};
    const nextErrors: AiFeatureResults = {};

    for (const item of FEATURES) {
      try {
        nextResults[item.key] = await requestFeature(item);
      } catch (error) {
        nextErrors[item.key] =
          error instanceof Error ? error.message : "AI gagal memproses request.";
      }

      setAllResults({ ...nextResults });
      setAllErrors({ ...nextErrors });
    }

    setLoadingMode(null);
    setMessage(
      Object.keys(nextErrors).length
        ? "Sebagian fitur gagal diproses. Cek detail hasil per fitur."
        : "Semua fitur AI selesai diproses."
    );
  }

  function buildReportDraft(): AiReportDraft {
    const singleResults: AiFeatureResults = result
      ? { [feature.key]: result }
      : {};
    const results = resultMode === "all" ? allResults : singleResults;
    const draftSections = parseAiDraftSections(results.draft ?? "");
    const sourceText = text.trim();
    const status =
      draftSections.status || parseReportStatus(sourceText) || "belum_selesai";

    return {
      source_text: sourceText,
      kegiatan:
        draftSections.kegiatan ||
        results.polish ||
        (feature.key !== "categorize" ? result : "") ||
        sourceText,
      kendala: draftSections.kendala,
      solusi:
        draftSections.solusi ||
        (needsSolution(sourceText) ? results.suggest_solution ?? "" : ""),
      status,
      category_name: (results.categorize ?? "").trim(),
      created_at: new Date().toISOString()
    };
  }

  function createReportDraft() {
    if (!text.trim() && !hasResult) {
      setMessage("Isi teks atau proses AI dulu sebelum membuat laporan baru.");
      return;
    }

    const draft = buildReportDraft();
    window.sessionStorage.setItem(AI_REPORT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    router.push("/reports/new?from_ai=1");
  }

  async function copyResult() {
    const textToCopy =
      resultMode === "all" ? formatAllResults(allResults, allErrors) : result;

    if (!textToCopy.trim()) {
      return;
    }

    await navigator.clipboard.writeText(textToCopy);
    setMessage("Hasil disalin.");
  }

  return (
    <div className="row g-3">
      <div className="col-lg-6">
        <div className="panel h-100">
          <div className="panel-header">
            <div className="feature-grid">
              {FEATURES.map((item) => (
                <button
                  className={`btn icon-btn ${
                    feature.key === item.key ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  key={item.key}
                  type="button"
                  onClick={() => setFeature(item)}
                >
                  {item.icon}
                  {AI_FEATURE_LABELS[item.key]}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            <label className="form-label" htmlFor="ai-input">
              Teks laporan
            </label>
            <textarea
              className="form-control textarea-tall"
              id="ai-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="hari ini ngerjain input data pelanggan, ada kendala file dobel, solusinya dicek ulang..."
            />
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button
                className="btn btn-primary icon-btn"
                type="button"
                disabled={loading}
                onClick={() => void runFeature()}
              >
                <Sparkles size={18} />
                {loadingMode === "single" ? "Memproses..." : "Proses AI"}
              </button>
              <button
                className="btn btn-outline-primary icon-btn"
                type="button"
                disabled={loading}
                onClick={() => void runAllFeatures()}
              >
                <Layers3 size={18} />
                {loadingMode === "all" ? "Menjalankan..." : "Jalankan Semua"}
              </button>
              <button
                className="btn btn-outline-secondary icon-btn"
                type="button"
                disabled={!text.trim() && !hasResult}
                onClick={createReportDraft}
              >
                <FilePlus2 size={18} />
                Jadi Laporan Baru
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="panel h-100">
          <div className="panel-header d-flex justify-content-between align-items-center gap-2">
            <h2 className="h5 mb-0">Hasil</h2>
            <button
              className="btn btn-outline-secondary btn-sm icon-btn"
              type="button"
              disabled={!hasResult && !Object.keys(allErrors).length}
              onClick={() => void copyResult()}
            >
              <Clipboard size={16} /> Salin
            </button>
          </div>
          <div className="panel-body">
            {message ? <div className="alert alert-info py-2">{message}</div> : null}
            {resultMode === "all" ? (
              <div className="ai-result-stack">
                {FEATURES.map((item) => (
                  <section className="ai-result-card" key={item.key}>
                    <div className="ai-result-card-title">
                      {item.icon}
                      <span>{AI_FEATURE_LABELS[item.key]}</span>
                    </div>
                    <div className="ai-result-card-body">
                      {allErrors[item.key] ? (
                        <span className="text-danger">{allErrors[item.key]}</span>
                      ) : (
                        allResults[item.key] ||
                        (loadingMode === "all" ? "Menunggu proses..." : "-")
                      )}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="form-control result-box">
                {result || "Hasil AI akan tampil di sini."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
