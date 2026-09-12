"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Music2, Pause, Play, Quote } from "lucide-react";
import type { Song } from "@/lib/types";
import { highlightText } from "@/lib/highlight";
import { useArtwork } from "@/hooks/useArtwork";
import { usePreviewPlayer } from "@/hooks/usePreviewPlayer";

export interface SongMatches {
  artist?: readonly (readonly [number, number])[];
  title?: readonly (readonly [number, number])[];
  lyrics?: readonly (readonly [number, number])[];
  code?: readonly (readonly [number, number])[];
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
  reduceMotion,
}: {
  song: Song;
  matches?: SongMatches;
  index: number;
  /** Skip entrance/layout animation — use for very long lists (e.g. "show all"). */
  reduceMotion?: boolean;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const snippet = lyricsSnippet(song.lyrics, matches?.lyrics);
  const { ref, artwork } = useArtwork(song.id);
  const { isPlaying, isLoading, toggle } = usePreviewPlayer(song.id, Boolean(artwork?.hasPreview));
  const [albumLoaded, setAlbumLoaded] = useState(false);
  const [albumFailed, setAlbumFailed] = useState(false);
  const [artistFailed, setArtistFailed] = useState(false);

  const showAlbumImage = Boolean(artwork?.albumImage) && !albumFailed;
  const showArtistAvatar = Boolean(artwork?.artistImage) && !artistFailed;

  const content = (
    <>
      <div
        className={`absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-14 min-w-[3.6rem] shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${accent} px-1 text-white shadow-lg`}
          title="Código no equipamento de karaokê"
        >
          <span className="text-[9px] font-semibold uppercase leading-none tracking-wider text-white/75">
            Nº
          </span>
          <span className="font-display text-[1.7rem] leading-none tracking-wide tabular-nums">
            {song.code}
          </span>
        </div>

        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-lg bg-white/5">
            {showAlbumImage && (
              // eslint-disable-next-line @next/next/no-img-element -- small hotlinked thumbnail from a public API, not worth Next/Image's remote-pattern config
              <img
                src={artwork!.albumImage!}
                alt=""
                loading="lazy"
                onLoad={() => setAlbumLoaded(true)}
                onError={() => setAlbumFailed(true)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  albumLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            {(!showAlbumImage || !albumLoaded) && (
              <div className="flex h-full w-full items-center justify-center text-white/25">
                <Music2 size={16} />
              </div>
            )}
          </div>

          {showArtistAvatar && (
            // eslint-disable-next-line @next/next/no-img-element -- small hotlinked thumbnail from a public API
            <img
              src={artwork!.artistImage!}
              alt=""
              loading="lazy"
              onError={() => setArtistFailed(true)}
              className="absolute -left-1.5 -top-1.5 h-5 w-5 rounded-full border-2 border-card object-cover shadow"
            />
          )}
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

        {artwork?.hasPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            disabled={isLoading}
            aria-label={isPlaying ? "Pausar prévia" : "Tocar prévia de 30 segundos"}
            title={isPlaying ? "Pausar prévia" : "Tocar prévia de 30 segundos"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow transition-colors disabled:cursor-wait ${
              isPlaying
                ? "bg-gradient-to-r from-neon-pink to-neon-violet text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={15} />
            ) : (
              <Play size={15} className="ml-0.5" />
            )}
          </button>
        )}
      </div>
    </>
  );

  if (reduceMotion) {
    return (
      <li ref={ref} className="group relative overflow-hidden rounded-2xl glass-card p-4 sm:p-5">
        {content}
      </li>
    );
  }

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl glass-card p-4 sm:p-5"
    >
      {content}
    </motion.li>
  );
}
