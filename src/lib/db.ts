import { nanoid } from "nanoid";
import { sql } from "./sql";
import type { Song, SongInput } from "./types";

interface SongRow {
  id: string;
  artist: string;
  title: string;
  lyrics: string;
  created_at: Date;
  updated_at: Date;
}

function toSong(row: SongRow): Song {
  return {
    id: row.id,
    artist: row.artist,
    title: row.title,
    lyrics: row.lyrics,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = await sql<SongRow[]>`
    SELECT id, artist, title, lyrics, created_at, updated_at
    FROM songs
    ORDER BY artist ASC, title ASC
  `;
  return rows.map(toSong);
}

export async function createSong(input: SongInput): Promise<Song> {
  const id = nanoid(10);
  const [row] = await sql<SongRow[]>`
    INSERT INTO songs (id, artist, title, lyrics)
    VALUES (${id}, ${input.artist.trim()}, ${input.title.trim()}, ${(input.lyrics ?? "").trim()})
    RETURNING id, artist, title, lyrics, created_at, updated_at
  `;
  return toSong(row);
}

export async function updateSong(id: string, input: SongInput): Promise<Song | null> {
  const [row] = await sql<SongRow[]>`
    UPDATE songs
    SET artist = ${input.artist.trim()},
        title = ${input.title.trim()},
        lyrics = ${(input.lyrics ?? "").trim()},
        updated_at = now()
    WHERE id = ${id}
    RETURNING id, artist, title, lyrics, created_at, updated_at
  `;
  return row ? toSong(row) : null;
}

export async function deleteSong(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM songs WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
