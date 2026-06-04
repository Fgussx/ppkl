import Link from "next/link";
import { ClipboardList, LayoutDashboard, LogIn, LogOut, Settings, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AppNavbar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
      <div className="container-fluid page-wrap">
        <Link className="navbar-brand fw-bold icon-btn" href={user ? "/dashboard" : "/login"}>
          <ClipboardList size={20} />
          PKL Report System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && isAdmin ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link icon-btn" href="/dashboard">
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link icon-btn" href="/admin/ai">
                    <Settings size={18} /> Admin AI
                  </Link>
                </li>
              </>
            ) : null}
            {user && !isAdmin ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link icon-btn" href="/reports">
                    <ClipboardList size={18} /> Laporan
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link icon-btn" href="/ai-tools">
                    <Sparkles size={18} /> AI Tools
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
          {user ? (
            <form action="/api/auth/logout" method="post">
              <button className="btn btn-outline-secondary icon-btn" type="submit">
                <LogOut size={18} /> Keluar
              </button>
            </form>
          ) : (
            <Link className="btn btn-outline-primary icon-btn" href="/login">
              <LogIn size={18} /> Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
