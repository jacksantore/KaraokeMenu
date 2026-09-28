import { NextRequest, NextResponse } from "next/server";
import { getSongById } from "@/lib/db";
import { getFreshPreviewUrl } from "@/lib/artwork";

// Always calls Deezer live (never cached) — give it room for a cold start
// plus the Deezer round trip (up to 5s) without hitting the default limit.
export const maxDuration = 15;

/**
 * Always resolves a live preview URL from Deezer — never cached, since the
 * clip link is a short-lived signed URL that goes stale within hours.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const song = await getSongById(id);

  if (!song) {
    return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  }

  const previewUrl = await getFreshPreviewUrl(song.artist, song.title);
  return NextResponse.json(
    { previewUrl },
    { headers: { "Cache-Control": "no-store" } }
  );
}
