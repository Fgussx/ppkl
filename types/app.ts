export type UserRole = "user" | "admin";

export type ReportStatus = "selesai" | "belum_selesai";

export type Profile = {
  id: string;
  email: string | null;
  nama: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type ActivityCategory = {
  id: string;
  name: string;
  created_at: string;
};

export type Report = {
  id: string;
  user_id: string;
  tanggal: string;
  activity_category_id: string | null;
  kegiatan: string;
  kendala: string | null;
  solusi: string | null;
  status: ReportStatus;
  dokumentasi_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportWithCategory = Report & {
  activity_categories?: {
    name: string;
  } | null;
  profiles?: {
    nama: string;
    email: string | null;
  } | null;
};

export type AiFeature =
  | "polish"
  | "summarize"
  | "draft"
  | "suggest_solution"
  | "categorize";

export type AiProvider = {
  id: string;
  name: string;
  base_url: string;
  model: string;
  api_key_encrypted: string;
  is_active: boolean;
  enabled_features: AiFeature[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AiProviderPublic = Omit<AiProvider, "api_key_encrypted"> & {
  api_key_saved: boolean;
};
