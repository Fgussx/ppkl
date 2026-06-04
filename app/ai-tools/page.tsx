import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AiToolsPanel } from "@/components/AiToolsPanel";
import { QuickShortcuts } from "@/components/QuickShortcuts";

export const dynamic = "force-dynamic";

export default async function AiToolsPage() {
  await requireUser();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Tools</h1>
          <p className="page-subtitle">Rapi, ringkas, dan susun draft laporan dari teks singkat.</p>
        </div>
        <Sparkles size={32} color="#0f766e" />
      </div>
      <QuickShortcuts current="ai-tools" />
      <AiToolsPanel />
    </div>
  );
}
