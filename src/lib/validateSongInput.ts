import type { SongInput } from "./types";

export function parseSongInput(body: unknown): { input: SongInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Dados inválidos." };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.artist !== "string" || !b.artist.trim()) {
    return { error: "Informe o artista da música." };
  }
  if (typeof b.title !== "string" || !b.title.trim()) {
    return { error: "Informe o título da música." };
  }

  const code = typeof b.code === "string" ? Number(b.code) : b.code;
  if (typeof code !== "number" || !Number.isInteger(code) || code <= 0) {
    return { error: "Informe o código da música (número inteiro positivo usado no equipamento de karaokê)." };
  }

  return {
    input: {
      code,
      artist: b.artist,
      title: b.title,
      lyrics: typeof b.lyrics === "string" ? b.lyrics : "",
    },
  };
}
