import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  code INTEGER NOT NULL UNIQUE,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_artwork (
  song_id TEXT PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
  artist_image TEXT,
  album_image TEXT,
  has_preview INTEGER NOT NULL DEFAULT 0,
  found INTEGER NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_info (
  song_id TEXT PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
  artist_bio TEXT,
  artist_thumbnail TEXT,
  artist_origin TEXT,
  artist_wiki_url TEXT,
  song_extract TEXT,
  song_thumbnail TEXT,
  song_wiki_url TEXT,
  found INTEGER NOT NULL,
  fetched_at TEXT NOT NULL
);
`;

declare global {
  var __karaokeDb: DatabaseSync | undefined;
}

export function resolveDatabasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "karaoke.db");
}

export function openDatabase(file: string): DatabaseSync {
  mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  // WAL: readers never block the writer (and vice versa) and a crash can't corrupt
  // the file; busy_timeout makes a rare write collision wait instead of failing.
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
  database.exec(SCHEMA);
  return database;
}

/** Lazily opened so `next build` (which imports route modules) never touches the file. */
export function db(): DatabaseSync {
  if (!globalThis.__karaokeDb) {
    globalThis.__karaokeDb = openDatabase(resolveDatabasePath());
  }
  return globalThis.__karaokeDb;
}
