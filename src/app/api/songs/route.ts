import { NextRequest, NextResponse } from "next/server";
import { createSong, getAllSongs } from "@/lib/db";

export async function GET() {
  const songs = await getAllSongs();
  return NextResponse.json(songs);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.artist !== "string" || !body.artist.trim() || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "Informe ao menos o nome do artista e o título da música." },
      { status: 400 }
    );
  }

  const song = await createSong({
    artist: body.artist,
    title: body.title,
    lyrics: typeof body.lyrics === "string" ? body.lyrics : "",
  });

  return NextResponse.json(song, { status: 201 });
}
