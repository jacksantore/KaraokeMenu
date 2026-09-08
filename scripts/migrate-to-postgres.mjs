import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Defina POSTGRES_URL_NON_POOLING (ou POSTGRES_URL) antes de rodar este script.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS songs (
      id text PRIMARY KEY,
      code integer NOT NULL UNIQUE,
      artist text NOT NULL,
      title text NOT NULL,
      lyrics text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("Tabela 'songs' pronta.");

  const [{ count: existing }] = await sql`SELECT count(*)::int AS count FROM songs`;
  if (Number(existing) > 0) {
    console.log(`Tabela já tem ${existing} músicas — pulando importação inicial.`);
    console.log("Para reimportar do zero, rode: TRUNCATE songs; antes deste script.");
    await sql.end({ timeout: 1 });
    return;
  }

  const raw = readFileSync(path.join(__dirname, "..", "data", "songs.json"), "utf-8");
  const songs = JSON.parse(raw);

  const batchSize = 200;
  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize).map((s) => ({
      id: s.id,
      code: s.code,
      artist: s.artist,
      title: s.title,
      lyrics: s.lyrics ?? "",
      created_at: s.createdAt ?? new Date().toISOString(),
      updated_at: s.updatedAt ?? new Date().toISOString(),
    }));
    await sql`
      INSERT INTO songs ${sql(batch, "id", "code", "artist", "title", "lyrics", "created_at", "updated_at")}
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`Importadas ${Math.min(i + batchSize, songs.length)} / ${songs.length}`);
  }

  console.log("Importação concluída.");
  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
