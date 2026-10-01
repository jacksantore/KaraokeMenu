"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, ExternalLink, MapPin, Music2, Mic, BookX } from "lucide-react";
import { useSongInfo } from "@/hooks/useSongInfo";
import type { Song } from "@/lib/types";

export default function SongInfoModal({
  song,
  open,
  onClose,
}: {
  song: Song | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, loading, failed } = useSongInfo(song?.id ?? "", open && Boolean(song));

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && song && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl glass-card bg-card/95 p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl tracking-wide text-white">
                  {song.title}
                </h2>
                <p className="truncate text-sm text-white/55">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/40">
                <Loader2 size={16} className="animate-spin" /> Buscando informações…
              </div>
            )}

            {!loading && (failed || !data?.found) && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-white/40">
                <BookX size={28} className="text-white/25" />
                Não encontramos informações sobre esta música ou artista.
              </div>
            )}

            {!loading && data?.found && (
              <div className="space-y-5">
                {data.songExtract && (
                  <section>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                      <Music2 size={13} /> Sobre a música
                    </p>
                    <div className="flex gap-3">
                      {data.songThumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element -- small hotlinked thumbnail from a public API
                        <img
                          src={data.songThumbnail}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <p className="text-sm leading-relaxed text-white/75">{data.songExtract}</p>
                    </div>
                    {data.songWikiUrl && (
                      <a
                        href={data.songWikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neon-cyan hover:underline"
                      >
                        Ver na Wikipédia <ExternalLink size={11} />
                      </a>
                    )}
                  </section>
                )}

                {(data.artistBio || data.artistOrigin) && (
                  <section>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                      <Mic size={13} /> Sobre o artista
                    </p>

                    {data.artistOrigin && (
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/60">
                        <MapPin size={12} className="shrink-0 text-neon-pink" /> {data.artistOrigin}
                      </p>
                    )}

                    <div className="flex gap-3">
                      {data.artistThumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element -- small hotlinked thumbnail from a public API
                        <img
                          src={data.artistThumbnail}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-full object-cover"
                        />
                      )}
                      {data.artistBio && (
                        <p className="text-sm leading-relaxed text-white/75">{data.artistBio}</p>
                      )}
                    </div>
                    {data.artistWikiUrl && (
                      <a
                        href={data.artistWikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neon-cyan hover:underline"
                      >
                        Ver na Wikipédia <ExternalLink size={11} />
                      </a>
                    )}
                  </section>
                )}

                <p className="text-[10px] text-white/25">
                  Fontes: Wikipédia e MusicBrainz. A precisão depende do quanto essas bases
                  públicas documentam cada música/artista.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
