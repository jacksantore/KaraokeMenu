import { nanoid } from "nanoid";
import { sql } from "./sql";
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
  created_at: Date;
  updated_at: Date;
}

function toSong(row: SongRow): Song {
  return {
    id: row.id,
    code: row.code,
    artist: row.artist,
    title: row.title,
    lyrics: row.lyrics,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = await sql<SongRow[]>`
    SELECT id, code, artist, title, lyrics, created_at, updated_at
    FROM songs
    ORDER BY artist ASC, title ASC
  `;
  return rows.map(toSong);
}

export async function createSong(input: SongInput): Promise<Song> {
  const id = nanoid(10);
  try {
    const [row] = await sql<SongRow[]>`
      INSERT INTO songs (id, code, artist, title, lyrics)
      VALUES (${id}, ${input.code}, ${input.artist.trim()}, ${input.title.trim()}, ${(input.lyrics ?? "").trim()})
      RETURNING id, code, artist, title, lyrics, created_at, updated_at
    `;
    return toSong(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateCodeError(input.code);
    throw err;
  }
}

export async function updateSong(id: string, input: SongInput): Promise<Song | null> {
  try {
    const [row] = await sql<SongRow[]>`
      UPDATE songs
      SET code = ${input.code},
          artist = ${input.artist.trim()},
          title = ${input.title.trim()},
          lyrics = ${(input.lyrics ?? "").trim()},
          updated_at = now()
      WHERE id = ${id}
      RETURNING id, code, artist, title, lyrics, created_at, updated_at
    `;
    return row ? toSong(row) : null;
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateCodeError(input.code);
    throw err;
  }
}

export async function deleteSong(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM songs WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
