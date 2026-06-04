import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import type { ReportStatus } from "@/types/app";

export const runtime = "nodejs";

const VALID_STATUS: ReportStatus[] = ["selesai", "belum_selesai"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function uploadDocumentation(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  file: FormDataEntryValue | null
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Dokumentasi harus berupa gambar.");
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Ukuran dokumentasi maksimal 3 MB.");
  }

  const path = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from("report-documentation").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user } = await requireUser();
  const formData = await request.formData();

  const tanggal = readText(formData, "tanggal");
  const kegiatan = readText(formData, "kegiatan");
  const kendala = readText(formData, "kendala") || null;
  const solusi = readText(formData, "solusi") || null;
  const status = readText(formData, "status") as ReportStatus;
  const activityCategoryId = readText(formData, "activity_category_id") || null;

  if (!tanggal || !kegiatan) {
    return jsonError("Tanggal dan kegiatan wajib diisi.");
  }

  if (!VALID_STATUS.includes(status)) {
    return jsonError("Status laporan tidak valid.");
  }

  try {
    const dokumentasiPath = await uploadDocumentation(
      supabase,
      user.id,
      formData.get("dokumentasi")
    );

    const updatePayload: Record<string, string | null> = {
      tanggal,
      kegiatan,
      kendala,
      solusi,
      status,
      activity_category_id: activityCategoryId
    };

    if (dokumentasiPath) {
      updatePayload.dokumentasi_path = dokumentasiPath;
    }

    const { data, error } = await supabase
      .from("reports")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return jsonError(error.message);
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Laporan gagal diperbarui.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError(error.message);
  }

  return NextResponse.json({ ok: true });
}
