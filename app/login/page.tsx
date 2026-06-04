import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="page-wrap">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5">
          <div className="panel">
            <div className="panel-header">
              <h1 className="h4 mb-1">Masuk</h1>
              <p className="page-subtitle">Gunakan akun laporan harian.</p>
            </div>
            <div className="panel-body">
              <AuthForm mode="login" />
              <p className="mt-3 mb-0 text-secondary">
                Belum punya akun? <Link href="/register">Daftar</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
