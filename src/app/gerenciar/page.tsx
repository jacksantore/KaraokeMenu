"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ListMusic } from "lucide-react";
import { useSongs } from "@/hooks/useSongs";
import SongFormModal from "@/components/SongFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toaster, { type ToastItem } from "@/components/Toaster";
import type { Song, SongInput } from "@/lib/types";

const PAGE_SIZE = 20;

export default function GerenciarPage() {
  const { songs, loading, error, createSong, editSong, removeSong } = useSongs();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function pushToast(message: string, type: ToastItem["type"] = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) => s.artist.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
  }, [songs, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function openCreate() {
    setEditingSong(null);
    setModalOpen(true);
  }

  function openEdit(song: Song) {
    setEditingSong(song);
    setModalOpen(true);
  }

  async function handleSubmit(input: SongInput) {
    if (editingSong) {
      await editSong(editingSong.id, input);
      pushToast("Música atualizada com sucesso.");
    } else {
      await createSong(input);
      pushToast("Música cadastrada com sucesso.");
      setQuery("");
      setPage(0);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeSong(deleteTarget.id);
      pushToast("Música excluída.");
      setDeleteTarget(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
            <ListMusic size={13} /> Gerenciar catálogo
          </p>
          <h1 className="font-display gradient-text mt-1 text-4xl sm:text-5xl">
            CADASTRO DE MÚSICAS
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {songs.length.toLocaleString("pt-BR")} músicas cadastradas
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-violet px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon-violet/20 transition-transform hover:scale-[1.02]"
        >
          <Plus size={17} /> Nova música
        </button>
      </motion.div>

      <div className="glow-ring mt-6 flex items-center gap-2 rounded-xl glass-card px-3.5 py-2.5">
        <Search size={17} className="shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Filtrar por artista ou título…"
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
        />
      </div>

      <div className="mt-5">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl glass-card" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {pageItems.length === 0 ? (
              <p className="rounded-xl glass-card p-8 text-center text-sm text-white/50">
                Nenhuma música encontrada para esse filtro.
              </p>
            ) : (
              <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl glass-card">
                {pageItems.map((song) => (
                  <li
                    key={song.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white sm:text-base">
                        {song.title}
                      </p>
                      <p className="truncate text-xs text-white/50 sm:text-sm">{song.artist}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(song)}
                        className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(song)}
                        className="rounded-lg p-2 text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={clampedPage === 0}
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs text-white/40">
                  Página {clampedPage + 1} de {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={clampedPage >= pageCount - 1}
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <SongFormModal
        open={modalOpen}
        song={editingSong}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir música?"
        description={
          deleteTarget ? `“${deleteTarget.title}” de ${deleteTarget.artist} será removida do catálogo.` : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Toaster toasts={toasts} />
    </div>
  );
}
