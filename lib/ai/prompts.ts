import type { AiFeature } from "@/types/app";

const baseRules = [
  "Gunakan bahasa Indonesia yang formal, jelas, dan cocok untuk laporan PKL atau pekerjaan.",
  "Jangan menambahkan fakta, tanggal, tempat, alat, hasil, kendala, atau solusi yang tidak ditulis user.",
  "Jika informasi kurang, rapikan yang ada saja dan jangan mengarang.",
  "Pertahankan istilah teknis yang umum dipakai user, misalnya database, coding, testing, atau input data.",
  "Keluarkan jawaban langsung tanpa pembuka seperti 'berikut hasilnya'."
].join("\n");

const polishRules = [
  baseRules,
  "Khusus Perbaiki Bahasa:",
  "- Jangan meringkas isi laporan.",
  "- Jangan mengubah kalimat menjadi terlalu pendek atau kaku.",
  "- Pertahankan sudut pandang user jika user memakai kata saya.",
  "- Jika input memakai kata 'hari ini', awali jawaban dengan tanggal hari ini.",
  "- Pastikan semua objek kegiatan penting dari input tetap muncul di output.",
  "- Ubah bahasa santai menjadi kalimat laporan harian yang natural.",
  "- Jika input hanya satu kegiatan pendek, buat satu kalimat formal yang utuh.",
  "- Hindari frasa pasif yang hambar seperti 'melakukan pembuatan'."
].join("\n");

function getTodayLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  }).format(new Date());
}

export function buildAiPrompt(feature: AiFeature, text: string) {
  const trimmedText = text.trim();
  const todayLabel = getTodayLabel();

  if (feature === "polish") {
    return {
      system: polishRules,
      user: `Perbaiki kata-kata laporan berikut agar terdengar profesional, natural, dan tetap sesuai fakta.

Contoh:
Input: hari ini saya membuat database
Output: ${todayLabel} - Pada hari ini, saya membuat database.

Input: hari ini ngerjain input data pelanggan
Output: ${todayLabel} - Pada hari ini, saya mengerjakan input data pelanggan.

Input: saya coding halaman login tapi error validasi, solusinya cek ulang form
Output: Pada hari ini, saya mengerjakan coding halaman login. Kendala yang ditemui adalah error pada validasi, dan solusinya dilakukan dengan mengecek ulang form.

Teks user:
${trimmedText}`
    };
  }

  if (feature === "summarize") {
    return {
      system: baseRules,
      user: `Ringkas laporan berikut menjadi 2-3 kalimat yang padat dan formal:\n\n${trimmedText}`
    };
  }

  if (feature === "draft") {
    return {
      system: baseRules,
      user: `Buat draft laporan harian lengkap dari poin singkat berikut. Gunakan format:\nKegiatan:\nKendala:\nSolusi:\nStatus:\n\nIsi bagian yang tidak tersedia dengan tanda "-".\n\nPoin user:\n${trimmedText}`
    };
  }

  if (feature === "suggest_solution") {
    return {
      system: baseRules,
      user: `Berikan saran solusi yang realistis berdasarkan kendala berikut. Jangan menambahkan konteks yang tidak ada:\n\n${trimmedText}`
    };
  }

  return {
    system: baseRules,
    user: `Tentukan satu kategori kegiatan paling sesuai dari daftar berikut: Coding, Desain, Input Data, Dokumentasi, Meeting, Testing, Riset, Administrasi, Lainnya.\n\nBalas hanya dengan nama kategori.\n\nTeks kegiatan:\n${trimmedText}`
  };
}
