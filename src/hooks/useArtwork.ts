"use client";

import { useEffect, useRef, useState } from "react";

export interface ArtworkData {
  artistImage: string | null;
  albumImage: string | null;
  previewUrl: string | null;
}

const cache = new Map<string, ArtworkData>();
const inflight = new Set<string>();

/**
 * Lazily fetches artist/album artwork for a song once its card scrolls into
 * view, and caches the result in memory for the rest of the session.
 */
export function useArtwork(songId: string) {
  const ref = useRef<HTMLLIElement>(null);
  const [data, setData] = useState<ArtworkData | null>(() => cache.get(songId) ?? null);

  useEffect(() => {
    if (data) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        if (inflight.has(songId)) return;
        inflight.add(songId);

        fetch(`/api/songs/${songId}/artwork`)
          .then((res) => (res.ok ? (res.json() as Promise<ArtworkData>) : null))
          .then((json) => {
            if (!json) return;
            cache.set(songId, json);
            setData(json);
          })
          .catch(() => {
            // ignore — card just keeps its fallback look
          })
          .finally(() => {
            inflight.delete(songId);
          });
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [songId, data]);

  return { ref, artwork: data };
}
