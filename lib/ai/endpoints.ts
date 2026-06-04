export function cleanAiBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function usesResponsesApi(baseUrl: string) {
  const cleanBaseUrl = cleanAiBaseUrl(baseUrl);

  try {
    return new URL(cleanBaseUrl).hostname === "api.openai.com";
  } catch {
    return cleanBaseUrl.includes("api.openai.com");
  }
}

export function getAiGenerationEndpoint(baseUrl: string) {
  const cleanBaseUrl = cleanAiBaseUrl(baseUrl);
  return usesResponsesApi(cleanBaseUrl)
    ? `${cleanBaseUrl}/responses`
    : `${cleanBaseUrl}/chat/completions`;
}
