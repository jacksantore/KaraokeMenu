import { NextRequest, NextResponse } from "next/server";
import { createSong, DuplicateCodeError, getAllSongs } from "@/lib/db";
import { parseSongInput } from "@/lib/validateSongInput";

export async function GET() {
  const songs = await getAllSongs();
  return NextResponse.json(songs);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseSongInput(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const song = await createSong(parsed.input);
    return NextResponse.json(song, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateCodeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
