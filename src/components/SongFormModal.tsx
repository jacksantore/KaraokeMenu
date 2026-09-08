"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Music2, Mic, FileText, Loader2, Hash, ImageIcon, Search } from "lucide-react";
import type { Song, SongInput } from "@/lib/types";

interface RawArtwork {
  artistImage: string | null;
  albumImage: string | null;
}

type ArtworkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; artistImage: string | null; albumImage: string | null }
  | { status: "empty" }
  | { status: "error"; message: string };

export default function SongFormModal({
  open,
  song,
  onClose,
  onSubmit,
}: {
  open: boolean;
  song: Song | null;
  onClose: () => void;
  onSubmit: (input: SongInput) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<ArtworkState>({ status: "idle" });

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form when the modal opens is intentional
      setCode(song ? String(song.code) : "");
      setArtist(song?.artist ?? "");
      setTitle(song?.title ?? "");
      setLyrics(song?.lyrics ?? "");
      setFormError(null);
    }
  }, [open, song]);

  useEffect(() => {
    if (!open) return;

    if (!song) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the preview when opening for a new song is intentional
      setArtwork({ status: "idle" });
      return;
    }

    setArtwork({ status: "loading" });
    fetch(`/api/songs/${song.id}/artwork`)
      .then((res) => (res.ok ? (res.json() as Promise<RawArtwork>) : null))
      .then((data) => {
        if (!data) {
          setArtwork({ status: "error", message: "Não foi possível carregar a imagem atual." });
        } else if (data.artistImage || data.albumImage) {
          setArtwork({ status: "found", ...data });
        } else {
          setArtwork({ status: "empty" });
        }
      })
      .catch(() => setArtwork({ status: "error", message: "Não foi possível carregar a imagem atual." }));
  }, [open, song]);

  async function handleSearchArtwork() {
    if (!artist.trim() || !title.trim()) return;
    setArtwork({ status: "loading" });
    try {
      const params = new URLSearchParams({ artist: artist.trim(), title: title.trim() });
      const res = await fetch(`/api/artwork/search?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setArtwork({ status: "error", message: data?.error ?? "Não foi possível buscar agora." });
        return;
      }
      const { artistImage, albumImage } = data as RawArtwork;
      setArtwork(
        artistImage || albumImage ? { status: "found", artistImage, albumImage } : { status: "empty" }
      );
    } catch {
      setArtwork({ status: "error", message: "Não foi possível buscar agora." });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const codeNumber = Number(code);
    if (!code.trim() || !Number.isInteger(codeNumber) || codeNumber <= 0) {
      setFormError("Informe o código da música (número usado no equipamento de karaokê).");
      return;
    }
    if (!artist.trim() || !title.trim()) {
      setFormError("Preencha o artista e o título da música.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({ code: codeNumber, artist, title, lyrics });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSearchArtwork = artist.trim().length > 0 && title.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl glass-card bg-card/95 p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-wide text-white">
                {song ? "Editar música" : "Nova música"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[7.5rem_1fr] gap-3">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                    <Hash size={13} /> Código
                  </span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: 1234"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-neon-violet"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                    <Mic size={13} /> Artista
                  </span>
                  <input
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ex: Jorge & Mateus"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-neon-violet"
                  />
                </label>
              </div>
              <p className="-mt-2.5 text-[11px] text-white/35">
                O código é o número usado para selecionar a música no equipamento de karaokê.
              </p>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                  <Music2 size={13} /> Título da música
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Propaganda"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-neon-violet"
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                    <ImageIcon size={13} /> Imagem (Deezer)
                  </span>
                  <button
                    type="button"
                    onClick={handleSearchArtwork}
                    disabled={!canSearchArtwork || artwork.status === "loading"}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {artwork.status === "loading" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    {artwork.status === "found" || artwork.status === "empty"
                      ? "Buscar novamente"
                      : "Buscar imagem"}
                  </button>
                </div>

                <div className="mt-2.5">
                  {artwork.status === "found" && (
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        <div className="h-full w-full overflow-hidden rounded-lg bg-white/10">
                          {artwork.albumImage && (
                            // eslint-disable-next-line @next/next/no-img-element -- small hotlinked preview from a public API
                            <img
                              src={artwork.albumImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {artwork.artistImage && (
                          // eslint-disable-next-line @next/next/no-img-element -- small hotlinked preview from a public API
                          <img
                            src={artwork.artistImage}
                            alt=""
                            className="absolute -left-1.5 -top-1.5 h-5 w-5 rounded-full border-2 border-card object-cover"
                          />
                        )}
                      </div>
                      <p className="text-xs text-emerald-300/85">
                        Imagem encontrada — vai aparecer na busca e nas listagens.
                      </p>
                    </div>
                  )}
                  {artwork.status === "empty" && (
                    <p className="text-xs text-white/40">
                      Nenhuma imagem encontrada no Deezer para esse artista/música.
                    </p>
                  )}
                  {artwork.status === "error" && (
                    <p className="text-xs text-red-300/80">{artwork.message}</p>
                  )}
                  {artwork.status === "idle" && (
                    <p className="text-xs text-white/35">
                      Preencha artista e música e clique em buscar para ver uma prévia (opcional — também é buscado automaticamente ao salvar).
                    </p>
                  )}
                  {artwork.status === "loading" && (
                    <p className="text-xs text-white/35">Buscando…</p>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/50">
                  <FileText size={13} /> Trecho da letra (opcional)
                </span>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Cole um trecho da letra para facilitar a busca depois…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-neon-violet"
                />
              </label>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-violet px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-neon-violet/20 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {song ? "Salvar alterações" : "Cadastrar música"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
