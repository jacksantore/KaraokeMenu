import { sql } from "./sql";

export interface ArtworkData {
  artistImage: string | null;
  albumImage: string | null;
}

interface ArtworkRow {
  song_id: string;
  artist_image: string | null;
  album_image: string | null;
  found: boolean;
}

interface DeezerTrack {
  artist?: { picture_medium?: string };
  album?: { cover_medium?: string };
}

interface DeezerSearchResponse {
  data?: DeezerTrack[];
}

async function searchDeezer(artist: string, title: string): Promise<ArtworkData | null> {
  const query = `artist:"${artist}" track:"${title}"`;
  const url = `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as DeezerSearchResponse;
    const track = json.data?.[0];
    if (!track) return { artistImage: null, albumImage: null };
    return {
      artistImage: track.artist?.picture_medium ?? null,
      albumImage: track.album?.cover_medium ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Looks up artist/album artwork for a song, caching results in Postgres so
 * we only hit the public Deezer API once per song. Returns empty images
 * (not an error) when nothing is found, so callers can render a fallback.
 */
export async function getArtwork(songId: string, artist: string, title: string): Promise<ArtworkData> {
  const [cached] = await sql<ArtworkRow[]>`
    SELECT song_id, artist_image, album_image, found
    FROM song_artwork
    WHERE song_id = ${songId}
  `;
  if (cached) {
    return { artistImage: cached.artist_image, albumImage: cached.album_image };
  }

  const result = await searchDeezer(artist, title);
  if (result === null) {
    // Transient failure (timeout/network) — don't cache, allow retry later.
    return { artistImage: null, albumImage: null };
  }

  const found = Boolean(result.artistImage || result.albumImage);
  await sql`
    INSERT INTO song_artwork (song_id, artist_image, album_image, found)
    VALUES (${songId}, ${result.artistImage}, ${result.albumImage}, ${found})
    ON CONFLICT (song_id) DO UPDATE SET
      artist_image = EXCLUDED.artist_image,
      album_image = EXCLUDED.album_image,
      found = EXCLUDED.found,
      fetched_at = now()
  `;

  return result;
}
