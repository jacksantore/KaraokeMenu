"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Sparkles, Mic2 } from "lucide-react";
import { useSongs } from "@/hooks/useSongs";
import SongCard from "@/components/SongCard";
import EqualizerIcon from "@/components/EqualizerIcon";
import { searchSongs } from "@/lib/search";

const RESULT_LIMIT = 60;

export default function HomePage() {
  const { songs, loading, error } = useSongs();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

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
          { name: "title", weight: 0.45 },
          { name: "artist", weight: 0.4 },
          { name: "lyrics", weight: 0.15 },
        ],
        threshold: 0.32,
        distance: 200,
        ignoreLocation: true,
        includeMatches: true,
        minMatchCharLength: 2,
      }),
    [songs]
  );

  const results = useMemo(() => {
    const q = deferredQuery.trim();
    if (!q) return null;
    return searchSongs(fuse, q, RESULT_LIMIT);
  }, [fuse, deferredQuery]);

  const suggestions = useMemo(() => {
    const count = songs.length;
    if (count === 0) return [];
    const take = Math.min(6, count);
    const step = Math.max(1, Math.floor(count / take));
    const picks: typeof songs = [];
    for (let i = 0; i < take; i++) {
      picks.push(songs[(i * step + i * 7) % count]);
    }
    return picks;
  }, [songs]);

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
          Busque por nome da música, artista ou até um pedacinho da letra.
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
            placeholder="Ex: Evidências, Jorge & Mateus, ou “nunca mais te esquecer”…"
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
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
              <Sparkles size={13} /> Sugestões para começar
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestions.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} />
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
