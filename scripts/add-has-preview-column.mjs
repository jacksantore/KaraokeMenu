import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Defina POSTGRES_URL_NON_POOLING (ou POSTGRES_URL) antes de rodar este script.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  await sql`ALTER TABLE song_artwork ADD COLUMN IF NOT EXISTS has_preview boolean NOT NULL DEFAULT false`;
  console.log("Coluna 'has_preview' garantida em song_artwork.");

  // Backfill from the old (now unused) preview_url column: if we'd found a
  // preview link before, Deezer almost certainly still has one — only the
  // signed URL itself went stale, not the track's availability.
  const result = await sql`
    UPDATE song_artwork
    SET has_preview = true
    WHERE has_preview = false AND preview_url IS NOT NULL
  `;
  console.log(`Backfill concluído (${result.count} linha(s) atualizadas a partir de preview_url).`);

  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
