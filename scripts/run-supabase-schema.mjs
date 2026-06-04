import fs from "fs";
import path from "path";
import { Client } from "pg";

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

async function main() {
  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum diisi di .env.local.");
  }

  const sqlPath = path.join(process.cwd(), "supabase", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const parsedUrl = new URL(databaseUrl);
  const client = new Client({
    connectionString: databaseUrl,
    ssl: parsedUrl.hostname.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined
  });

  await client.connect();
  await client.query(sql);

  const { rows } = await client.query(`
    select
      to_regclass('public.profiles') as profiles,
      to_regclass('public.activity_categories') as activity_categories,
      to_regclass('public.reports') as reports,
      to_regclass('public.ai_providers') as ai_providers
  `);

  await client.end();

  console.log("Migration selesai.");
  console.table(rows);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
