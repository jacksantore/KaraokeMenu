// Importa músicas de um arquivo JSON (ex.: export do banco antigo via /api/songs)
// para o SQLite. Idempotente: músicas com mesmo id são atualizadas, o resto é inserido.
//
// Uso: node scripts/import-songs.mjs <arquivo.json> [caminho/do/karaoke.db]
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [, , file, dbArg] = process.argv;
if (!file) {
  console.error("Uso: node scripts/import-songs.mjs <arquivo.json> [caminho/do/karaoke.db]");
  process.exit(1);
}

const dbPath = dbArg ?? process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "karaoke.db");
const songs = JSON.parse(readFileSync(file, "utf-8"));
if (!Array.isArray(songs)) throw new Error("O arquivo precisa conter um array de músicas.");

mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    code INTEGER NOT NULL UNIQUE,
    artist TEXT NOT NULL,
    title TEXT NOT NULL,
    lyrics TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const upsert = db.prepare(`
  INSERT INTO songs (id, code, artist, title, lyrics, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET
    code = excluded.code, artist = excluded.artist, title = excluded.title,
    lyrics = excluded.lyrics, updated_at = excluded.updated_at
`);

const now = new Date().toISOString();
db.exec("BEGIN");
try {
  for (const s of songs) {
    upsert.run(
      String(s.id),
      Number(s.code),
      s.artist,
      s.title,
      s.lyrics ?? "",
      s.createdAt ?? now,
      s.updatedAt ?? now
    );
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

const { total } = db.prepare("SELECT count(*) AS total FROM songs").get();
const { withLyrics } = db.prepare("SELECT count(*) AS withLyrics FROM songs WHERE lyrics != ''").get();
console.log(`Importadas ${songs.length} músicas. Total no banco: ${total} (${withLyrics} com trecho de letra).`);
db.close();
