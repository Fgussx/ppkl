import Link from "next/link";
import { ClipboardList, LayoutDashboard, Plus, Settings, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type QuickShortcutsProps = {
  current?: "dashboard" | "reports" | "new-report" | "ai-tools" | "admin-ai";
};

function shortcutClass(active: boolean) {
  return `btn icon-btn ${active ? "btn-primary" : "btn-outline-secondary"}`;
}

export async function QuickShortcuts({ current }: QuickShortcutsProps) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  if (!user) {
    return null;
  }

  return (
    <div className="panel mb-3">
      <div className="panel-header">
        <h2 className="h5 mb-0">Pintasan Cepat</h2>
      </div>
      <div className="panel-body">
        <div className="d-flex flex-wrap gap-2">
          <Link className={shortcutClass(current === "dashboard")} href="/dashboard">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link className={shortcutClass(current === "reports")} href="/reports">
            <ClipboardList size={18} /> Laporan Saya
          </Link>
          <Link className={shortcutClass(current === "new-report")} href="/reports/new">
            <Plus size={18} /> Laporan Baru
          </Link>
          <Link className={shortcutClass(current === "ai-tools")} href="/ai-tools">
            <Sparkles size={18} /> AI Tools
          </Link>
          {isAdmin ? (
            <Link className={shortcutClass(current === "admin-ai")} href="/admin/ai">
              <Settings size={18} /> Admin AI
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
