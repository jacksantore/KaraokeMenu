"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ListMusic, Mic2, ChevronLeft, ChevronRight, ArrowDownAZ, Mic } from "lucide-react";
import { useSongs } from "@/hooks/useSongs";
import SongCard from "@/components/SongCard";
import EqualizerIcon from "@/components/EqualizerIcon";
import { searchSongs } from "@/lib/search";
import type { Song } from "@/lib/types";

const RESULT_LIMIT = 60;
const BROWSE_PAGE_SIZE = 24;

type SortBy = "artist" | "title";

export default function HomePage() {
  const { songs, loading, error } = useSongs();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sortBy, setSortBy] = useState<SortBy>("artist");
  const [browsePage, setBrowsePage] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(songs, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "artist", weight: 0.35 },
          { name: "code", weight: 0.15, getFn: (song: Song) => String(song.code) },
          { name: "lyrics", weight: 0.1 },
        ],
        threshold: 0.32,
        distance: 200,
        ignoreLocation: true,
        includeMatches: true,
        minMatchCharLength: 1,
      }),
    [songs]
  );

  const results = useMemo(() => {
    const q = deferredQuery.trim();
    if (!q) return null;
    return searchSongs(fuse, q, RESULT_LIMIT);
  }, [fuse, deferredQuery]);

  const browseSongs = useMemo(() => {
    const copy = [...songs];
    copy.sort((a, b) => {
      const primary =
        sortBy === "artist"
          ? a.artist.localeCompare(b.artist, "pt-BR") || a.title.localeCompare(b.title, "pt-BR")
          : a.title.localeCompare(b.title, "pt-BR") || a.artist.localeCompare(b.artist, "pt-BR");
      return primary;
    });
    return copy;
  }, [songs, sortBy]);

  const browsePageCount = Math.max(1, Math.ceil(browseSongs.length / BROWSE_PAGE_SIZE));
  const clampedBrowsePage = Math.min(browsePage, browsePageCount - 1);
  const browsePageItems = browseSongs.slice(
    clampedBrowsePage * BROWSE_PAGE_SIZE,
    clampedBrowsePage * BROWSE_PAGE_SIZE + BROWSE_PAGE_SIZE
  );

  function changeSort(next: SortBy) {
    setSortBy(next);
    setBrowsePage(0);
  }

  const showEmptyState = !loading && !error && !deferredQuery.trim();
  const showNoResults = !loading && results && results.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs font-medium text-white/70"
        >
          <EqualizerIcon />
          Karaokê Party Box · {songs.length.toLocaleString("pt-BR")} músicas no catálogo
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display gradient-text text-5xl leading-none sm:text-7xl"
        >
          QUAL VAI SER
          <br />A PRÓXIMA?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-3 max-w-md text-sm text-white/55 sm:text-base"
        >
          Busque por nome da música, artista, código ou até um pedacinho da letra.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glow-ring sticky top-[68px] z-30 mx-auto mt-8 max-w-2xl rounded-2xl glass-card p-1.5 shadow-2xl shadow-black/40 sm:mt-10"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <Search size={20} className="shrink-0 text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Evidências, Jorge & Mateus, ou o código da música…"
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none sm:text-base"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline">
              /
            </kbd>
          )}
        </div>
      </motion.div>

      <div className="mt-8">
        {loading && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="skeleton h-24 rounded-2xl glass-card" />
            ))}
          </ul>
        )}

        {error && (
          <p className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && results && (
          <>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              {results.length}{" "}
              {results.length === 1 ? "resultado encontrado" : "resultados encontrados"}
            </p>
            <AnimatePresence mode="popLayout">
              <motion.ul layout className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((r, i) => {
                  const matchMap = Object.fromEntries(
                    (r.matches ?? []).map((m) => [m.key, m.indices])
                  );
                  return (
                    <SongCard
                      key={r.item.id}
                      song={r.item}
                      index={i}
                      matches={{
                        title: matchMap.title,
                        artist: matchMap.artist,
                        lyrics: matchMap.lyrics,
                        code: matchMap.code,
                      }}
                    />
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </>
        )}

        {showNoResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-6 max-w-md rounded-2xl glass-card p-8 text-center"
          >
            <Mic2 className="mx-auto mb-3 text-white/30" size={32} />
            <p className="text-white/70">
              Nenhuma música encontrada para <span className="text-white">“{deferredQuery}”</span>.
            </p>
            <p className="mt-1 text-sm text-white/40">
              Tente outro termo, o nome do artista, ou cadastre essa música em Gerenciar.
            </p>
          </motion.div>
        )}

        {showEmptyState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                <ListMusic size={13} /> Catálogo completo
              </p>

              <div className="flex items-center gap-1 rounded-full glass-card p-1 text-xs">
                <span className="hidden pl-2 text-white/35 sm:inline">Ordenar por</span>
                <button
                  onClick={() => changeSort("artist")}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
                    sortBy === "artist"
                      ? "bg-gradient-to-r from-neon-pink to-neon-violet text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <Mic size={12} /> Artista
                </button>
                <button
                  onClick={() => changeSort("title")}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors ${
                    sortBy === "title"
                      ? "bg-gradient-to-r from-neon-pink to-neon-violet text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <ArrowDownAZ size={12} /> Música
                </button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.ul layout className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {browsePageItems.map((song, i) => (
                  <SongCard key={song.id} song={song} index={i} />
                ))}
              </motion.ul>
            </AnimatePresence>

            {browsePageCount > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setBrowsePage((p) => Math.max(0, p - 1))}
                  disabled={clampedBrowsePage === 0}
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-white/40">
                  Página {clampedBrowsePage + 1} de {browsePageCount}
                </span>
                <button
                  onClick={() => setBrowsePage((p) => Math.min(browsePageCount - 1, p + 1))}
                  disabled={clampedBrowsePage >= browsePageCount - 1}
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
