import { NextRequest, NextResponse } from "next/server";
import { searchArtwork } from "@/lib/artwork";

/**
 * Live preview lookup used by the cadastro form, before a song has an id
 * to key a cache row on. Not persisted — the real cache write happens via
 * GET /api/songs/[id]/artwork once the song exists.
 */
export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist")?.trim();
  const title = request.nextUrl.searchParams.get("title")?.trim();

  if (!artist || !title) {
    return NextResponse.json(
      { error: "Informe artista e título para buscar a imagem." },
      { status: 400 }
    );
  }

  const result = await searchArtwork(artist, title);
  if (result === null) {
    return NextResponse.json(
      { error: "Não foi possível buscar a imagem agora. Tente novamente." },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
