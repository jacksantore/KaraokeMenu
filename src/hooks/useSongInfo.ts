"use client";

import { useEffect, useState } from "react";

export interface SongInfoData {
  found: boolean;
  artistBio: string | null;
  artistThumbnail: string | null;
  artistOrigin: string | null;
  artistWikiUrl: string | null;
  songExtract: string | null;
  songThumbnail: string | null;
  songWikiUrl: string | null;
}

const cache = new Map<string, SongInfoData>();

/** Fetches background info (Wikipedia + MusicBrainz, cached server-side) for
 * a song once `enabled` — i.e. once the detail modal is actually open. */
export function useSongInfo(songId: string, enabled: boolean) {
  const [data, setData] = useState<SongInfoData | null>(() => cache.get(songId) ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !songId || data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open is intentional here
    setLoading(true);
    setFailed(false);

    fetch(`/api/songs/${songId}/info`)
      .then((res) => (res.ok ? (res.json() as Promise<SongInfoData>) : Promise.reject()))
      .then((json) => {
        cache.set(songId, json);
        setData(json);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [songId, enabled, data]);

  return { data, loading, failed };
}
