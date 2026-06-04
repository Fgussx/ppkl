import type { AiFeature } from "@/types/app";

export const AI_FEATURES: AiFeature[] = [
  "polish",
  "summarize",
  "draft",
  "suggest_solution",
  "categorize"
];

export const AI_FEATURE_LABELS: Record<AiFeature, string> = {
  polish: "Perbaiki Bahasa",
  summarize: "Ringkas Laporan",
  draft: "Draft Lengkap",
  suggest_solution: "Saran Solusi",
  categorize: "Kategori Otomatis"
};

export function normalizeFeatures(value: unknown): AiFeature[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is AiFeature =>
    AI_FEATURES.includes(item as AiFeature)
  );
}

export function isAiFeature(value: string): value is AiFeature {
  return AI_FEATURES.includes(value as AiFeature);
}
