import { nanoid } from "nanoid";
import { db } from "./sqlite";
import type { Song, SongInput } from "./types";

export class DuplicateCodeError extends Error {
  constructor(code: number) {
    super(`Já existe uma música cadastrada com o código ${code}.`);
    this.name = "DuplicateCodeError";
  }
}

interface SongRow {
  id: string;
  code: number;
  artist: string;
  title: string;
  lyrics: string;
  created_at: string;
  updated_at: string;
}

const SONG_COLUMNS = "id, code, artist, title, lyrics, created_at, updated_at";

function toSong(row: SongRow): Song {
  return {
    id: row.id,
    code: row.code,
    artist: row.artist,
    title: row.title,
    lyrics: row.lyrics,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = db()
    .prepare(`SELECT ${SONG_COLUMNS} FROM songs ORDER BY artist COLLATE NOCASE, title COLLATE NOCASE`)
    .all() as unknown as SongRow[];
  return rows.map(toSong);
}

export async function getSongById(id: string): Promise<Song | null> {
  const row = db().prepare(`SELECT ${SONG_COLUMNS} FROM songs WHERE id = ?`).get(id) as unknown as
    | SongRow
    | undefined;
  return row ? toSong(row) : null;
}

export async function createSong(input: SongInput): Promise<Song> {
  const id = nanoid(10);
  const now = new Date().toISOString();
  try {
    db()
      .prepare(
        `INSERT INTO songs (id, code, artist, title, lyrics, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.code, input.artist.trim(), input.title.trim(), (input.lyrics ?? "").trim(), now, now);
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateCodeError(input.code);
    throw err;
  }
  return (await getSongById(id))!;
}

export async function updateSong(id: string, input: SongInput): Promise<Song | null> {
  const previous = await getSongById(id);
  if (!previous) return null;

  const artist = input.artist.trim();
  const title = input.title.trim();

  try {
    db()
      .prepare(
        `UPDATE songs
         SET code = ?, artist = ?, title = ?, lyrics = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(input.code, artist, title, (input.lyrics ?? "").trim(), new Date().toISOString(), id);
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateCodeError(input.code);
    throw err;
  }

  // Artist/title changed — any cached artwork/background info no longer
  // matches; drop it so the next lookup fetches fresh data.
  if (previous.artist !== artist || previous.title !== title) {
    db().prepare("DELETE FROM song_artwork WHERE song_id = ?").run(id);
    db().prepare("DELETE FROM song_info WHERE song_id = ?").run(id);
  }

  return getSongById(id);
}

export async function deleteSong(id: string): Promise<boolean> {
  const result = db().prepare("DELETE FROM songs WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}
