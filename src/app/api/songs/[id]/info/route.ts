import { NextRequest, NextResponse } from "next/server";
import { getSongById } from "@/lib/db";
import { getSongInfo } from "@/lib/songInfo";

// Cache miss does up to five external requests (Wikipedia x4, MusicBrainz x1)
// plus a cold start + DB round trips — give it real headroom.
export const maxDuration = 20;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const song = await getSongById(id);

  if (!song) {
    return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  }

  const info = await getSongInfo(song.id, song.artist, song.title);
  return NextResponse.json(info, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
