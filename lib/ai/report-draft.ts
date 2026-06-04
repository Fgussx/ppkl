import type { AiFeature, ReportStatus } from "@/types/app";

export const AI_REPORT_DRAFT_STORAGE_KEY = "pkl-report-ai-draft";

export type AiFeatureResults = Partial<Record<AiFeature, string>>;

export type AiReportDraft = {
  source_text: string;
  kegiatan: string;
  kendala: string;
  solusi: string;
  status: ReportStatus;
  category_name: string;
  created_at: string;
};

type DraftSections = {
  kegiatan: string;
  kendala: string;
  solusi: string;
  status: ReportStatus | "";
};

function cleanSectionValue(value: string) {
  const cleaned = value.trim();
  return cleaned === "-" ? "" : cleaned;
}

function readSection(text: string, label: string) {
  const pattern = new RegExp(
    `${label}\\s*:\\s*([\\s\\S]*?)(?=\\n(?:Kegiatan|Kendala|Solusi|Status)\\s*:|$)`,
    "i"
  );
  const match = text.match(pattern);
  return cleanSectionValue(match?.[1] ?? "");
}

export function parseReportStatus(value: string): ReportStatus | "" {
  const normalized = value.toLowerCase();

  if (normalized.includes("belum")) {
    return "belum_selesai";
  }

  if (normalized.includes("selesai")) {
    return "selesai";
  }

  return "";
}

export function parseAiDraftSections(text: string): DraftSections {
  const statusText = readSection(text, "Status");

  return {
    kegiatan: readSection(text, "Kegiatan"),
    kendala: readSection(text, "Kendala"),
    solusi: readSection(text, "Solusi"),
    status: parseReportStatus(statusText)
  };
}

export function normalizeCategoryName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
