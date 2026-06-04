import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/ai/crypto";
import { cleanAiBaseUrl, getAiGenerationEndpoint, usesResponsesApi } from "@/lib/ai/endpoints";
import { buildAiPrompt } from "@/lib/ai/prompts";
import { normalizeFeatures } from "@/lib/ai/features";
import type { AiFeature, AiProvider } from "@/types/app";

type OpenAiResponseContent = {
  type?: string;
  text?: string;
};

type OpenAiResponseOutput = {
  content?: OpenAiResponseContent[];
};

type OpenAiResponseBody = {
  output_text?: string;
  output?: OpenAiResponseOutput[];
  error?: {
    message?: string;
  };
};

type ChatCompletionBody = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractOutputText(body: OpenAiResponseBody) {
  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text.trim();
  }

  const parts =
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text?.trim())) ?? [];

  return parts.join("\n").trim();
}

function extractChatCompletionText(body: ChatCompletionBody) {
  return (
    body.choices
      ?.map((choice) => choice.message?.content)
      .find((content) => Boolean(content?.trim()))
      ?.trim() ?? ""
  );
}

function includesTodayPhrase(text: string) {
  return /\bhari\s+ini\b/i.test(text);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  }).format(new Date());
}

function stripLeadingDatePrefix(text: string) {
  const monthNames =
    "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember";
  const datePattern = `[0-9]{1,2}\\s+(?:${monthNames})\\s+[0-9]{4}`;

  return text
    .trim()
    .replace(new RegExp(`^(?:pada\\s+tanggal\\s+|tanggal\\s+)?${datePattern}\\s*[-–—,:]?\\s*`, "i"), "")
    .trim();
}

function extractSimpleActivityObject(input: string) {
  const cleanedInput = input
    .trim()
    .replace(/^hari\s+ini\s+/i, "")
    .replace(/^saya\s+/i, "");
  const match = cleanedInput.match(
    /^(?:membuat|mengerjakan|menginput|input|menyusun|memperbaiki|mendesain|coding|testing)\s+(.+)$/i
  );

  return match?.[1]?.trim().replace(/[.。]+$/, "") ?? "";
}

function repairIncompletePolishResult(input: string, result: string) {
  const normalizedResult = result.trim().replace(/[.。]+$/, "").trim();

  if (!/\b(?:membuat|mengerjakan|menginput|input|menyusun|memperbaiki|mendesain|coding|testing)$/i.test(normalizedResult)) {
    return result;
  }

  const activityObject = extractSimpleActivityObject(input);

  if (!activityObject) {
    return result;
  }

  return `${normalizedResult} ${activityObject}.`;
}

function applyOutputRules(feature: AiFeature, input: string, result: string) {
  if (feature !== "polish" || !includesTodayPhrase(input)) {
    return result;
  }

  const todayLabel = getTodayLabel();
  const trimmedResult = repairIncompletePolishResult(
    input,
    stripLeadingDatePrefix(result)
  );

  return `${todayLabel} - ${trimmedResult}`;
}

export async function getActiveAiProvider(feature: AiFeature) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal membaca provider AI: ${error.message}`);
  }

  if (!data) {
    throw new Error("Provider AI aktif belum tersedia.");
  }

  const provider = data as AiProvider;
  const features = normalizeFeatures(provider.enabled_features);

  if (!features.includes(feature)) {
    throw new Error("Fitur AI ini belum diaktifkan admin.");
  }

  return provider;
}

export async function callAiProvider(
  provider: AiProvider,
  feature: AiFeature,
  text: string
) {
  const apiKey = decryptApiKey(provider.api_key_encrypted);
  const { system, user } = buildAiPrompt(feature, text);
  const baseUrl = cleanAiBaseUrl(provider.base_url);

  if (!usesResponsesApi(baseUrl)) {
    const response = await fetch(getAiGenerationEndpoint(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.2,
        max_tokens: feature === "draft" ? 900 : 450
      })
    });

    const body = (await response.json().catch(() => ({}))) as ChatCompletionBody;

    if (!response.ok) {
      throw new Error(body.error?.message ?? "Provider AI gagal memproses request.");
    }

    const result = extractChatCompletionText(body);

    if (!result) {
      throw new Error("Provider AI tidak mengembalikan teks.");
    }

    return result;
  }

  const response = await fetch(getAiGenerationEndpoint(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: provider.model,
      input: [
        { role: "developer", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2,
      max_output_tokens: feature === "draft" ? 900 : 450
    })
  });

  const body = (await response.json().catch(() => ({}))) as OpenAiResponseBody;

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Provider AI gagal memproses request.");
  }

  const result = extractOutputText(body);

  if (!result) {
    throw new Error("Provider AI tidak mengembalikan teks.");
  }

  return result;
}

export async function runAiFeature(feature: AiFeature, text: string) {
  const cleanedText = text.trim();

  if (!cleanedText) {
    throw new Error("Teks tidak boleh kosong.");
  }

  if (cleanedText.length > 4000) {
    throw new Error("Teks terlalu panjang. Maksimal 4000 karakter.");
  }

  const provider = await getActiveAiProvider(feature);
  const result = applyOutputRules(
    feature,
    cleanedText,
    await callAiProvider(provider, feature, cleanedText)
  );

  return {
    result,
    provider: {
      id: provider.id,
      name: provider.name,
      model: provider.model
    }
  };
}
