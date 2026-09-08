import { NextRequest, NextResponse } from "next/server";
import { deleteSong, updateSong } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.artist !== "string" || !body.artist.trim() || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "Informe ao menos o nome do artista e o título da música." },
      { status: 400 }
    );
  }

  const song = await updateSong(id, {
    artist: body.artist,
    title: body.title,
    lyrics: typeof body.lyrics === "string" ? body.lyrics : "",
  });

  if (!song) {
    return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  }

  return NextResponse.json(song);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteSong(id);

  if (!ok) {
    return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
