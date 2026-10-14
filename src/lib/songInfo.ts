import { sql } from "./sql";

const USER_AGENT = "KaraokeMenu/1.0 (karaoke catalog app; contato via GitHub jacksantore/KaraokeMenu)";

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

interface WikiSearchResponse {
  query?: { search?: { title: string }[] };
}

interface WikiSummary {
  title: string;
  extract?: string;
  description?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const CONNECTOR_WORDS = new Set(["e", "and", "the", "de", "da", "do", "a", "o"]);

function significantWords(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !CONNECTOR_WORDS.has(w));
}

/**
 * A search for a messy, compound query (e.g. our catalog's "Anime Beyblade -
 * Abertura" placeholder "artist") can score 100 on an unrelated result that
 * only shares one short, generic word. Require the candidate's own
 * significant words to all show up in the query — and for a single-word
 * candidate, require the query to BE that word, not just contain it.
 */
function isConfidentNameMatch(query: string, candidateName: string): boolean {
  const candidateWords = significantWords(candidateName);
  if (candidateWords.length === 0) return false;
  if (candidateWords.length === 1) {
    return normalize(query).trim() === normalize(candidateName).trim();
  }
  const queryWords = new Set(significantWords(query));
  return candidateWords.every((w) => queryWords.has(w));
}

async function searchWikipediaTitle(query: string): Promise<string | null> {
  const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch=${encodeURIComponent(
    query
  )}`;
  const json = await fetchJson<WikiSearchResponse>(url);
  return json?.query?.search?.[0]?.title ?? null;
}

async function getWikipediaSummary(
  title: string
): Promise<{ extract: string | null; thumbnail: string | null; url: string | null } | null> {
  const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const json = await fetchJson<WikiSummary>(url);
  if (!json) return null;
  return {
    extract: json.extract ?? null,
    thumbnail: json.thumbnail?.source ?? null,
    url: json.content_urls?.desktop?.page ?? null,
  };
}

interface MusicBrainzArea {
  name?: string;
}

interface MusicBrainzArtist {
  name?: string;
  type?: string;
  country?: string;
  area?: MusicBrainzArea;
  "begin-area"?: MusicBrainzArea;
  "life-span"?: { begin?: string };
}

interface MusicBrainzSearchResponse {
  artists?: MusicBrainzArtist[];
}

const COUNTRY_NAMES_PT: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  GB: "Reino Unido",
  PT: "Portugal",
  AR: "Argentina",
  FR: "França",
  DE: "Alemanha",
  ES: "Espanha",
  JP: "Japão",
  IT: "Itália",
  CA: "Canadá",
  AU: "Austrália",
  MX: "México",
  CO: "Colômbia",
  SE: "Suécia",
  IE: "Irlanda",
};

async function getArtistOrigin(artist: string): Promise<string | null> {
  // A loose query (not the field-scoped artist:"…" syntax) copes much better
  // with our catalog's accent-stripped, ALL-CAPS-derived names not matching
  // MusicBrainz's canonical spelling exactly (e.g. "Chitaozinho e Xororo"
  // vs "Chitãozinho & Xororó").
  const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(artist)}&fmt=json&limit=1`;
  const json = await fetchJson<MusicBrainzSearchResponse>(url);
  const a = json?.artists?.[0];
  if (!a || !a.name || !isConfidentNameMatch(artist, a.name)) return null;

  const beginArea = a["begin-area"]?.name ?? null;
  const country = a.country ? (COUNTRY_NAMES_PT[a.country] ?? a.area?.name ?? null) : (a.area?.name ?? null);
  const since = a["life-span"]?.begin;
  const kind = a.type === "Group" ? "Grupo" : a.type === "Person" ? "Artista" : null;

  const parts: string[] = [];
  if (kind) parts.push(kind);
  if (beginArea && country) parts.push(`${beginArea}, ${country}`);
  else if (beginArea || country) parts.push((beginArea ?? country)!);
  if (since) parts.push(`desde ${since}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Guards against an `intitle:` match that happens to share words with the
 * song title but is actually about something unrelated — only trust it if
 * the artist is mentioned somewhere in the summary. */
function mentionsArtist(text: string, artist: string): boolean {
  const haystack = normalize(text);
  const words = significantWords(artist);
  if (words.length === 0) return normalize(artist).length > 0 && haystack.includes(normalize(artist));
  return words.some((w) => haystack.includes(w));
}

/**
 * Looks up background info for a song/artist from free, keyless public
 * sources: Wikipedia (song article when one exists, plus the artist's
 * article for a bio) and MusicBrainz (structured artist origin). Results
 * vary a lot by fame — a regional track with no dedicated Wikipedia page
 * still gets the artist's bio when available.
 */
export async function lookupSongInfo(artist: string, title: string): Promise<SongInfoData> {
  const [songTitle, artistTitle, artistOrigin] = await Promise.all([
    searchWikipediaTitle(`intitle:${title} canção`),
    searchWikipediaTitle(artist),
    getArtistOrigin(artist),
  ]);

  const [rawSongSummary, artistSummary] = await Promise.all([
    songTitle ? getWikipediaSummary(songTitle) : Promise.resolve(null),
    artistTitle ? getWikipediaSummary(artistTitle) : Promise.resolve(null),
  ]);

  const songText = `${rawSongSummary?.extract ?? ""} ${songTitle ?? ""}`;
  const songSummary = rawSongSummary && mentionsArtist(songText, artist) ? rawSongSummary : null;

  const result: SongInfoData = {
    found: Boolean(songSummary?.extract || artistSummary?.extract || artistOrigin),
    artistBio: artistSummary?.extract ?? null,
    artistThumbnail: artistSummary?.thumbnail ?? null,
    artistOrigin,
    artistWikiUrl: artistSummary?.url ?? null,
    songExtract: songSummary?.extract ?? null,
    songThumbnail: songSummary?.thumbnail ?? null,
    songWikiUrl: songSummary?.url ?? null,
  };

  return result;
}

interface SongInfoRow {
  found: boolean;
  artist_bio: string | null;
  artist_thumbnail: string | null;
  artist_origin: string | null;
  artist_wiki_url: string | null;
  song_extract: string | null;
  song_thumbnail: string | null;
  song_wiki_url: string | null;
}

function fromRow(row: SongInfoRow): SongInfoData {
  return {
    found: row.found,
    artistBio: row.artist_bio,
    artistThumbnail: row.artist_thumbnail,
    artistOrigin: row.artist_origin,
    artistWikiUrl: row.artist_wiki_url,
    songExtract: row.song_extract,
    songThumbnail: row.song_thumbnail,
    songWikiUrl: row.song_wiki_url,
  };
}

/** Cached wrapper around lookupSongInfo — each song is only looked up once. */
export async function getSongInfo(songId: string, artist: string, title: string): Promise<SongInfoData> {
  const [cached] = await sql<SongInfoRow[]>`
    SELECT found, artist_bio, artist_thumbnail, artist_origin, artist_wiki_url,
           song_extract, song_thumbnail, song_wiki_url
    FROM song_info
    WHERE song_id = ${songId}
  `;
  if (cached) return fromRow(cached);

  const result = await lookupSongInfo(artist, title);

  await sql`
    INSERT INTO song_info (
      song_id, artist_bio, artist_thumbnail, artist_origin, artist_wiki_url,
      song_extract, song_thumbnail, song_wiki_url, found
    )
    VALUES (
      ${songId}, ${result.artistBio}, ${result.artistThumbnail}, ${result.artistOrigin}, ${result.artistWikiUrl},
      ${result.songExtract}, ${result.songThumbnail}, ${result.songWikiUrl}, ${result.found}
    )
    ON CONFLICT (song_id) DO UPDATE SET
      artist_bio = EXCLUDED.artist_bio,
      artist_thumbnail = EXCLUDED.artist_thumbnail,
      artist_origin = EXCLUDED.artist_origin,
      artist_wiki_url = EXCLUDED.artist_wiki_url,
      song_extract = EXCLUDED.song_extract,
      song_thumbnail = EXCLUDED.song_thumbnail,
      song_wiki_url = EXCLUDED.song_wiki_url,
      found = EXCLUDED.found,
      fetched_at = now()
  `;

  return result;
}
