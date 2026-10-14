import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Defina POSTGRES_URL_NON_POOLING (ou POSTGRES_URL) antes de rodar este script.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS song_info (
      song_id text PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
      artist_bio text,
      artist_thumbnail text,
      artist_origin text,
      artist_wiki_url text,
      song_extract text,
      song_thumbnail text,
      song_wiki_url text,
      found boolean NOT NULL,
      fetched_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log("Tabela 'song_info' pronta.");
  await sql.end({ timeout: 1 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
