import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { BootstrapClient } from "@/components/BootstrapClient";
import { AppNavbar } from "@/components/AppNavbar";

export const metadata: Metadata = {
  title: "PKL Report System",
  description: "Sistem laporan harian PKL dengan rekap dan AI tools."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-bs-theme="dark">
      <body>
        <BootstrapClient />
        <AppNavbar />
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
