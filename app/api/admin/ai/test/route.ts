import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, isRecord } from "@/lib/api";
import { decryptApiKey } from "@/lib/ai/crypto";
import { cleanAiBaseUrl, getAiGenerationEndpoint, usesResponsesApi } from "@/lib/ai/endpoints";

export const runtime = "nodejs";

type TestProviderInput = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

async function testProvider({ baseUrl, model, apiKey }: TestProviderInput) {
  const cleanBaseUrl = cleanAiBaseUrl(baseUrl);
  const response = await fetch(getAiGenerationEndpoint(cleanBaseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      usesResponsesApi(cleanBaseUrl)
        ? {
            model,
            input: [
              {
                role: "developer",
                content: "Balas hanya dengan kata OK."
              },
              {
                role: "user",
                content: "Tes koneksi."
              }
            ],
            max_output_tokens: 20
          }
        : {
            model,
            messages: [
              {
                role: "system",
                content: "Balas hanya dengan kata OK."
              },
              {
                role: "user",
                content: "Tes koneksi."
              }
            ],
            max_tokens: 20
          }
    )
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Tes koneksi provider gagal.");
  }
}

export async function POST(request: Request) {
  await requireAdmin();
  const payload = (await request.json().catch(() => null)) as unknown;

  if (!isRecord(payload)) {
    return jsonError("Payload tidak valid.");
  }

  try {
    if (typeof payload.provider_id === "string" && payload.provider_id) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("ai_providers")
        .select("base_url,model,api_key_encrypted")
        .eq("id", payload.provider_id)
        .single();

      if (error || !data) {
        return jsonError(error?.message ?? "Provider tidak ditemukan.", 404);
      }

      await testProvider({
        baseUrl: String(data.base_url),
        model: String(data.model),
        apiKey: decryptApiKey(String(data.api_key_encrypted))
      });

      return NextResponse.json({ ok: true });
    }

    const baseUrl =
      typeof payload.base_url === "string" && payload.base_url.trim()
        ? payload.base_url.trim()
        : "https://api.openai.com/v1";
    const model = typeof payload.model === "string" ? payload.model.trim() : "";
    const apiKey = typeof payload.api_key === "string" ? payload.api_key.trim() : "";

    if (!model || !apiKey) {
      return jsonError("Model dan API key wajib diisi untuk tes provider baru.");
    }

    try {
      new URL(baseUrl);
    } catch {
      return jsonError("Base URL tidak valid.");
    }

    await testProvider({ baseUrl, model, apiKey });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Tes koneksi gagal.", 500);
  }
}
