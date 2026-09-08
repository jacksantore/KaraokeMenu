import { NextRequest, NextResponse } from "next/server";
import { deleteSong, DuplicateCodeError, updateSong } from "@/lib/db";
import { parseSongInput } from "@/lib/validateSongInput";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = parseSongInput(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const song = await updateSong(id, parsed.input);
    if (!song) {
      return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
    }
    return NextResponse.json(song);
  } catch (err) {
    if (err instanceof DuplicateCodeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
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
