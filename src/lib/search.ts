import type Fuse from "fuse.js";
import type { FuseResult } from "fuse.js";
import type { Song } from "./types";

export interface SearchMatch {
  key?: string;
  indices: readonly (readonly [number, number])[];
}

export interface SearchResult {
  item: Song;
  matches: SearchMatch[];
}

function toResult(r: FuseResult<Song>): SearchResult {
  return {
    item: r.item,
    matches: (r.matches ?? []).map((m) => ({ key: m.key, indices: m.indices })),
  };
}

/**
 * Runs a whole-phrase fuzzy search, and for multi-word queries also intersects
 * per-word results so a query like "jorge mateus propaganda" (artist + title
 * typed together) still matches even though no single field contains the
 * whole phrase contiguously.
 */
export function searchSongs(fuse: Fuse<Song>, query: string, limit: number): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const tokens = Array.from(new Set(q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)));

  if (tokens.length <= 1) {
    return fuse.search(q, { limit }).map(toResult);
  }

  const perToken = tokens.map((t) => fuse.search(t, { limit: 1000 }));
  const idSets = perToken.map((results) => new Set(results.map((r) => r.item.id)));
  const commonIds = idSets.reduce(
    (acc, set) => new Set([...acc].filter((id) => set.has(id)))
  );

  if (commonIds.size === 0) {
    // Words don't co-occur across fields; fall back to a contiguous-phrase match.
    return fuse.search(q, { limit }).map(toResult);
  }

  const itemById = new Map<string, Song>();
  const scoreById = new Map<string, number>();
  const matchesById = new Map<string, Map<string, Array<readonly [number, number]>>>();

  perToken.forEach((results) => {
    results.forEach((r) => {
      if (!commonIds.has(r.item.id)) return;
      itemById.set(r.item.id, r.item);
      scoreById.set(r.item.id, (scoreById.get(r.item.id) ?? 0) + (r.score ?? 1));

      const keyMap = matchesById.get(r.item.id) ?? new Map();
      (r.matches ?? []).forEach((m) => {
        if (!m.key) return;
        const arr = keyMap.get(m.key) ?? [];
        arr.push(...m.indices);
        keyMap.set(m.key, arr);
      });
      matchesById.set(r.item.id, keyMap);
    });
  });

  return [...commonIds]
    .map((id) => ({
      item: itemById.get(id)!,
      score: scoreById.get(id) ?? 1,
      matches: Array.from((matchesById.get(id) ?? new Map()).entries()).map(([key, indices]) => ({
        key,
        indices,
      })),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ item, matches }) => ({ item, matches }));
}
