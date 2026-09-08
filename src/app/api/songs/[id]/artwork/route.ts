import { NextRequest, NextResponse } from "next/server";
import { getSongById } from "@/lib/db";
import { getArtwork } from "@/lib/artwork";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const song = await getSongById(id);

  if (!song) {
    return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  }

  const artwork = await getArtwork(song.id, song.artist, song.title);
  return NextResponse.json(artwork, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
