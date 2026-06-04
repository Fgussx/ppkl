import { handleAiFeatureRequest } from "@/lib/ai/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleAiFeatureRequest(request, "draft");
}
