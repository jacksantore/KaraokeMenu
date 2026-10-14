import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Defina POSTGRES_URL_NON_POOLING (ou POSTGRES_URL) antes de rodar este script.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  await sql`ALTER TABLE song_artwork ADD COLUMN IF NOT EXISTS preview_url text`;
  console.log("Coluna 'preview_url' garantida em song_artwork.");
  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
