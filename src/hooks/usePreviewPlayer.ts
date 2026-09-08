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

function play(id: string, url: string) {
  if (currentId === id) {
    stop();
    return;
  }
  stop();
  const audio = new Audio(url);
  audio.addEventListener("ended", stop);
  audio.play().catch(stop);
  currentAudio = audio;
  currentId = id;
  notify();
}

/** Plays a song's 30s Deezer preview clip; starting one stops any other that's playing. */
export function usePreviewPlayer(id: string, url: string | null) {
  const [isPlaying, setIsPlaying] = useState(() => currentId === id);

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

  const toggle = useCallback(() => {
    if (url) play(id, url);
  }, [id, url]);

  return { isPlaying, toggle };
}
