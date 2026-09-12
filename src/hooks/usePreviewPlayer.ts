"use client";

import { useCallback, useEffect, useState } from "react";

let currentAudio: HTMLAudioElement | null = null;
let currentId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function stop() {
  currentAudio?.pause();
  currentAudio = null;
  currentId = null;
  notify();
}

function playUrl(id: string, url: string) {
  stop();
  const audio = new Audio(url);
  audio.addEventListener("ended", stop);
  audio.play().catch(stop);
  currentAudio = audio;
  currentId = id;
  notify();
}

/**
 * Plays a song's 30s Deezer preview clip; starting one stops any other
 * that's playing. The clip URL is a short-lived signed link, so it's
 * resolved fresh from the server on every play instead of being cached.
 */
export function usePreviewPlayer(id: string, hasPreview: boolean) {
  const [isPlaying, setIsPlaying] = useState(() => currentId === id);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsPlaying(currentId === id);
    }
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
      if (currentId === id) stop();
    };
  }, [id]);

  const toggle = useCallback(async () => {
    if (!hasPreview) return;
    if (currentId === id) {
      stop();
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/songs/${id}/preview`);
      if (!res.ok) return;
      const data = (await res.json()) as { previewUrl: string | null };
      if (data.previewUrl) playUrl(id, data.previewUrl);
    } catch {
      // ignore — button just stays idle
    } finally {
      setIsLoading(false);
    }
  }, [id, hasPreview]);

  return { isPlaying, isLoading, toggle };
}
