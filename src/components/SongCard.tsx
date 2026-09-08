"use client";

import { motion } from "framer-motion";
import { Music2, Quote } from "lucide-react";
import type { Song } from "@/lib/types";
import { highlightText } from "@/lib/highlight";

export interface SongMatches {
  artist?: readonly (readonly [number, number])[];
  title?: readonly (readonly [number, number])[];
  lyrics?: readonly (readonly [number, number])[];
}

const ACCENTS = [
  "from-neon-pink to-neon-violet",
  "from-neon-violet to-neon-cyan",
  "from-neon-cyan to-neon-yellow",
  "from-neon-yellow to-neon-pink",
];

function lyricsSnippet(lyrics: string, ranges?: readonly (readonly [number, number])[]) {
  if (!lyrics) return null;
  if (!ranges || ranges.length === 0) {
    return lyrics.length > 90 ? lyrics.slice(0, 90) + "…" : lyrics;
  }
  const [start] = ranges[0];
  const from = Math.max(0, start - 30);
  const to = Math.min(lyrics.length, start + 70);
  const prefix = from > 0 ? "…" : "";
  const suffix = to < lyrics.length ? "…" : "";
  const adjusted = ranges.map(([s, e]) => [s - from, e - from] as const);
  return { text: prefix + lyrics.slice(from, to) + suffix, ranges: adjusted, offset: from - prefix.length };
}

export default function SongCard({
  song,
  matches,
  index,
}: {
  song: Song;
  matches?: SongMatches;
  index: number;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const snippet = lyricsSnippet(song.lyrics, matches?.lyrics);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl glass-card p-4 sm:p-5"
    >
      <div
        className={`absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
      />
      <div className="relative flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}
        >
          <Music2 size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white sm:text-lg">
            {highlightText(song.title, matches?.title)}
          </h3>
          <p className="truncate text-sm text-white/60">
            {highlightText(song.artist, matches?.artist)}
          </p>
          {snippet && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-white/45 italic">
              <Quote size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">
                {typeof snippet === "string"
                  ? snippet
                  : highlightText(snippet.text, snippet.ranges)}
              </span>
            </p>
          )}
        </div>
      </div>
    </motion.li>
  );
}
