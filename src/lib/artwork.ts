import { sql } from "./sql";

export interface ArtworkData {
  artistImage: string | null;
  albumImage: string | null;
  /** Whether Deezer has a playable 30s clip — the clip URL itself is fetched
   * fresh at play time (see getFreshPreviewUrl) because it's a short-lived
   * signed link that would go stale if cached. */
  hasPreview: boolean;
}

interface ArtworkRow {
  song_id: string;
  artist_image: string | null;
  album_image: string | null;
  has_preview: boolean;
  found: boolean;
}

interface DeezerTrack {
  preview?: string;
  artist?: { picture_medium?: string };
  album?: { cover_medium?: string };
}

interface DeezerSearchResponse {
  data?: DeezerTrack[];
}

interface DeezerLookup {
  artistImage: string | null;
  albumImage: string | null;
  previewUrl: string | null;
}

async function queryDeezer(artist: string, title: string): Promise<DeezerLookup | null> {
  // A loose free-text query is more forgiving than field-scoped artist:"…"
  // track:"…" search — our catalog's names are normalized from an all-caps,
  // accent-stripped PDF (e.g. "Jorge e Mateus" vs Deezer's "Jorge & Mateus"),
  // and the strict field syntax can miss real matches over small naming
  // differences that Deezer's relevance ranking handles fine in free text.
  const query = `${artist} ${title}`;
  const url = `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as DeezerSearchResponse;
    const track = json.data?.[0];
    if (!track) return { artistImage: null, albumImage: null, previewUrl: null };
    return {
      artistImage: track.artist?.picture_medium ?? null,
      albumImage: track.album?.cover_medium ?? null,
      previewUrl: track.preview ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchArtwork(artist: string, title: string): Promise<ArtworkData | null> {
  const result = await queryDeezer(artist, title);
  if (result === null) return null;
  return {
    artistImage: result.artistImage,
    albumImage: result.albumImage,
    hasPreview: Boolean(result.previewUrl),
  };
}

/**
 * Fetches a fresh, playable preview URL. Never cached: Deezer's preview
 * links are signed with a short-lived expiring token, so a URL fetched
 * more than a few hours ago may already be dead.
 */
export async function getFreshPreviewUrl(artist: string, title: string): Promise<string | null> {
  const result = await queryDeezer(artist, title);
  return result?.previewUrl ?? null;
}

/**
 * Looks up artist/album artwork for a song, caching results in Postgres so
 * we only hit the public Deezer API once per song. Returns empty fields
 * (not an error) when nothing is found, so callers can render a fallback.
 */
export async function getArtwork(songId: string, artist: string, title: string): Promise<ArtworkData> {
  const [cached] = await sql<ArtworkRow[]>`
    SELECT song_id, artist_image, album_image, has_preview, found
    FROM song_artwork
    WHERE song_id = ${songId}
  `;
  // A "not found" result is worth retrying (e.g. after a search-query
  // improvement) — only a confirmed match is trusted as a permanent cache hit.
  if (cached && cached.found) {
    return {
      artistImage: cached.artist_image,
      albumImage: cached.album_image,
      hasPreview: cached.has_preview,
    };
  }

  const result = await searchArtwork(artist, title);
  if (result === null) {
    // Transient failure (timeout/network) — don't cache, allow retry later.
    return { artistImage: null, albumImage: null, hasPreview: false };
  }

  const found = Boolean(result.artistImage || result.albumImage);
  await sql`
    INSERT INTO song_artwork (song_id, artist_image, album_image, has_preview, found)
    VALUES (${songId}, ${result.artistImage}, ${result.albumImage}, ${result.hasPreview}, ${found})
    ON CONFLICT (song_id) DO UPDATE SET
      artist_image = EXCLUDED.artist_image,
      album_image = EXCLUDED.album_image,
      has_preview = EXCLUDED.has_preview,
      found = EXCLUDED.found,
      fetched_at = now()
  `;

  return result;
}
