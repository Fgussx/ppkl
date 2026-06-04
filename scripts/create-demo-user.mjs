import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local belum ada.");
  }

  const env = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);

    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }

  return env;
}

async function findUserByEmail(supabase, email) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  const email = process.env.DEMO_EMAIL || "demon@local.test";
  const password = process.env.DEMO_PASSWORD || "race12";
  const nama = process.env.DEMO_NAME || "demon";
  const role = process.env.DEMO_ROLE || "admin";

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diisi.");
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let user = await findUserByEmail(supabase, email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama }
    });

    if (error) {
      throw error;
    }

    user = data.user;
  } else {
    const updatePayload = {
      email_confirm: true,
      user_metadata: { nama }
    };

    if (password.length >= 6) {
      updatePayload.password = password;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      ...updatePayload
    });

    if (error) {
      throw error;
    }

    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email,
    nama,
    role
  });

  if (profileError) {
    throw new Error(
      `User Auth sudah siap, tapi profile gagal dibuat: ${profileError.message}. Jalankan supabase/schema.sql dulu, lalu ulangi npm run user:demo.`
    );
  }

  console.log(`Demo user ready: ${email} / ${password} (${role})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
