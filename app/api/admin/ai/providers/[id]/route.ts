import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, isRecord } from "@/lib/api";
import { encryptApiKey } from "@/lib/ai/crypto";
import { AI_FEATURES, normalizeFeatures } from "@/lib/ai/features";
import type { AiProviderPublic } from "@/types/app";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function publicProvider(row: Record<string, unknown>): AiProviderPublic {
  return {
    id: String(row.id),
    name: String(row.name),
    base_url: String(row.base_url),
    model: String(row.model),
    is_active: Boolean(row.is_active),
    enabled_features: normalizeFeatures(row.enabled_features),
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    api_key_saved: true
  };
}

function readPatchPayload(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error("Payload tidak valid.");
  }

  const update: Record<string, unknown> = {};

  if (typeof payload.name === "string") {
    const name = payload.name.trim();
    if (!name) {
      throw new Error("Nama provider wajib diisi.");
    }
    update.name = name;
  }

  if (typeof payload.base_url === "string") {
    const baseUrl = payload.base_url.trim() || "https://api.openai.com/v1";
    try {
      new URL(baseUrl);
    } catch {
      throw new Error("Base URL tidak valid.");
    }
    update.base_url = baseUrl;
  }

  if (typeof payload.model === "string") {
    const model = payload.model.trim();
    if (!model) {
      throw new Error("Model wajib diisi.");
    }
    update.model = model;
  }

  if (typeof payload.api_key === "string" && payload.api_key.trim()) {
    update.api_key_encrypted = encryptApiKey(payload.api_key.trim());
  }

  if (typeof payload.is_active === "boolean") {
    update.is_active = payload.is_active;
  }

  if (Array.isArray(payload.enabled_features)) {
    const features = normalizeFeatures(payload.enabled_features);
    update.enabled_features = features.length ? features : AI_FEATURES;
  }

  return update;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  await requireAdmin();
  const supabase = createAdminClient();
  const payload = await request.json().catch(() => null);

  try {
    const update = readPatchPayload(payload);

    if (Object.keys(update).length === 0) {
      return jsonError("Tidak ada data yang diperbarui.");
    }

    if (update.is_active === true) {
      await supabase.from("ai_providers").update({ is_active: false }).neq("id", id);
    }

    const { data, error } = await supabase
      .from("ai_providers")
      .update(update)
      .eq("id", id)
      .select("id,name,base_url,model,is_active,enabled_features,created_by,created_at,updated_at")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ provider: publicProvider(data) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Provider gagal diperbarui.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("ai_providers").delete().eq("id", id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ ok: true });
}
