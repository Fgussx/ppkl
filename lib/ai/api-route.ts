import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, isRecord } from "@/lib/api";
import { runAiFeature } from "@/lib/ai/provider";
import type { AiFeature } from "@/types/app";

export async function handleAiFeatureRequest(request: Request, feature: AiFeature) {
  await requireUser();

  const payload = (await request.json().catch(() => null)) as unknown;

  if (!isRecord(payload) || typeof payload.text !== "string") {
    return jsonError("Input teks wajib dikirim.");
  }

  try {
    const data = await runAiFeature(feature, payload.text);
    return NextResponse.json({ feature, ...data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI gagal memproses request.", 500);
  }
}
