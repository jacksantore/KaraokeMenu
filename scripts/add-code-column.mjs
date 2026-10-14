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
  await sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS code integer`;
  console.log("Coluna 'code' garantida.");

  const raw = readFileSync(path.join(__dirname, "..", "data", "songs.json"), "utf-8");
  const songs = JSON.parse(raw);

  const batchSize = 200;
  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize);
    await sql.begin((tx) =>
      Promise.all(batch.map((s) => tx`UPDATE songs SET code = ${s.code} WHERE id = ${s.id}`))
    );
    console.log(`Atualizadas ${Math.min(i + batchSize, songs.length)} / ${songs.length}`);
  }

  const stillNull = await sql`SELECT id, artist, title FROM songs WHERE code IS NULL`;
  if (stillNull.length > 0) {
    console.warn(
      `Atenção: ${stillNull.length} música(s) sem código (provavelmente cadastradas depois da importação):`,
      stillNull.map((r) => `${r.id} - ${r.artist} - ${r.title}`)
    );
  } else {
    await sql`ALTER TABLE songs ALTER COLUMN code SET NOT NULL`;
    console.log("Coluna 'code' marcada como NOT NULL.");
  }

  const [{ dup_count }] = await sql`
    SELECT count(*)::int AS dup_count FROM (
      SELECT code FROM songs GROUP BY code HAVING count(*) > 1
    ) t
  `;
  if (Number(dup_count) === 0) {
    await sql`
      ALTER TABLE songs
      DROP CONSTRAINT IF EXISTS songs_code_key,
      ADD CONSTRAINT songs_code_key UNIQUE (code)
    `;
    console.log("Restrição UNIQUE aplicada em 'code'.");
  } else {
    console.warn(`Atenção: ${dup_count} código(s) duplicado(s) — restrição UNIQUE não aplicada.`);
  }

  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
