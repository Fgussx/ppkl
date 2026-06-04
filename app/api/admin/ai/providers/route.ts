import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, isRecord } from "@/lib/api";
import { encryptApiKey } from "@/lib/ai/crypto";
import { AI_FEATURES, normalizeFeatures } from "@/lib/ai/features";
import type { AiProviderPublic } from "@/types/app";

export const runtime = "nodejs";

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

function readProviderPayload(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error("Payload tidak valid.");
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const baseUrl =
    typeof payload.base_url === "string" && payload.base_url.trim()
      ? payload.base_url.trim()
      : "https://api.openai.com/v1";
  const model = typeof payload.model === "string" ? payload.model.trim() : "";
  const apiKey = typeof payload.api_key === "string" ? payload.api_key.trim() : "";
  const isActive = Boolean(payload.is_active);
  const enabledFeatures = normalizeFeatures(payload.enabled_features);

  if (!name) {
    throw new Error("Nama provider wajib diisi.");
  }

  if (!model) {
    throw new Error("Model wajib diisi.");
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error("Base URL tidak valid.");
  }

  return {
    name,
    baseUrl,
    model,
    apiKey,
    isActive,
    enabledFeatures: enabledFeatures.length ? enabledFeatures : AI_FEATURES
  };
}

export async function GET() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_providers")
    .select("id,name,base_url,model,is_active,enabled_features,created_by,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({
    providers: (data ?? []).map((provider) => publicProvider(provider))
  });
}

export async function POST(request: Request) {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const payload = await request.json().catch(() => null);

  try {
    const provider = readProviderPayload(payload);

    if (!provider.apiKey) {
      return jsonError("API key wajib diisi untuk provider baru.");
    }

    if (provider.isActive) {
      await supabase.from("ai_providers").update({ is_active: false }).eq("is_active", true);
    }

    const { data, error } = await supabase
      .from("ai_providers")
      .insert({
        name: provider.name,
        base_url: provider.baseUrl,
        model: provider.model,
        api_key_encrypted: encryptApiKey(provider.apiKey),
        is_active: provider.isActive,
        enabled_features: provider.enabledFeatures,
        created_by: user.id
      })
      .select("id,name,base_url,model,is_active,enabled_features,created_by,created_at,updated_at")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ provider: publicProvider(data) }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Provider gagal disimpan.");
  }
}
