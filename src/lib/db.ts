import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { Song, SongInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "songs.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<Song[]> {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw) as Song[];
  } catch {
    return [];
  }
}

function persist(songs: Song[]) {
  writeQueue = writeQueue.then(() =>
    writeFile(DATA_FILE, JSON.stringify(songs, null, 2), "utf-8")
  );
  return writeQueue;
}

export async function getAllSongs(): Promise<Song[]> {
  const songs = await readAll();
  return songs.sort((a, b) => a.artist.localeCompare(b.artist, "pt-BR") || a.title.localeCompare(b.title, "pt-BR"));
}

export async function createSong(input: SongInput): Promise<Song> {
  const songs = await readAll();
  const now = new Date().toISOString();
  const song: Song = {
    id: nanoid(10),
    artist: input.artist.trim(),
    title: input.title.trim(),
    lyrics: (input.lyrics ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  songs.push(song);
  await persist(songs);
  return song;
}

export async function updateSong(id: string, input: SongInput): Promise<Song | null> {
  const songs = await readAll();
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Song = {
    ...songs[idx],
    artist: input.artist.trim(),
    title: input.title.trim(),
    lyrics: (input.lyrics ?? "").trim(),
    updatedAt: new Date().toISOString(),
  };
  songs[idx] = updated;
  await persist(songs);
  return updated;
}

export async function deleteSong(id: string): Promise<boolean> {
  const songs = await readAll();
  const next = songs.filter((s) => s.id !== id);
  if (next.length === songs.length) return false;
  await persist(next);
  return true;
}
