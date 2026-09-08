"use client";

import { useCallback, useEffect, useState } from "react";
import type { Song, SongInput } from "@/lib/types";

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar o catálogo.");
      const data = (await res.json()) as Song[];
      setSongs(data);
    } catch {
      setError("Não foi possível carregar as músicas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional here
    refresh();
  }, [refresh]);

  const createSong = useCallback(async (input: SongInput) => {
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Não foi possível cadastrar a música.");
    }
    const song = (await res.json()) as Song;
    setSongs((prev) => [...prev, song]);
    return song;
  }, []);

  const editSong = useCallback(async (id: string, input: SongInput) => {
    const res = await fetch(`/api/songs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Não foi possível atualizar a música.");
    }
    const song = (await res.json()) as Song;
    setSongs((prev) => prev.map((s) => (s.id === id ? song : s)));
    return song;
  }, []);

  const removeSong = useCallback(async (id: string) => {
    const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Não foi possível excluir a música.");
    }
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { songs, loading, error, refresh, createSong, editSong, removeSong };
}
