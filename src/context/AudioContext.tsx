"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { NormalizedTrack } from "@/types/setlist";
import type { AudioPreviewResult } from "@/lib/audio-preview";

interface AudioContextType {
  activeTrack: NormalizedTrack | null;
  artistName: string | null;
  previewUrl: string | null;
  artworkUrl: string | null;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  progress: number; // 0 to 1
  currentTime: number; // in seconds
  duration: number; // in seconds
  errorMessage: string | null;
  playTrack: (track: NormalizedTrack, artistName: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  toggleTrack: (track: NormalizedTrack, artistName: string) => void;
  seek: (seconds: number) => void;
  stop: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTrack, setActiveTrack] = useState<NormalizedTrack | null>(null);
  const [artistName, setArtistName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and bind single HTML5 Audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        setProgress(audio.currentTime / audio.duration);
      } else if (audio.currentTime) {
        setCurrentTime(audio.currentTime);
        setProgress(Math.min(audio.currentTime / 30, 1));
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoadingAudio(false);
      setErrorMessage(null);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      // Auto-dismiss mini player when track finishes
      setActiveTrack(null);
      setArtistName(null);
      setPreviewUrl(null);
      setArtworkUrl(null);
    };

    const onError = () => {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setErrorMessage("Audio playback error");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Visibility Safety: Pause audio when tab is hidden to prevent background noise
    const onVisibilityChange = () => {
      if (document.hidden && !audio.paused) {
        audio.pause();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setActiveTrack(null);
    setArtistName(null);
    setPreviewUrl(null);
    setArtworkUrl(null);
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setProgress(0);
    setCurrentTime(0);
    setErrorMessage(null);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.src && audio.paused) {
      audio.play().catch((err) => {
        console.warn("[Audio] Resume failed:", err);
      });
    }
  }, []);

  const playTrack = useCallback(
    async (track: NormalizedTrack, artist: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      // 1. Immediately pause and clear previous stream
      audio.pause();
      audio.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
      setErrorMessage(null);

      // 2. Set active track in loading state
      setActiveTrack(track);
      setArtistName(artist);
      setIsLoadingAudio(true);
      setIsPlaying(false);

      try {
        // 3. Resolve 30s preview URL from serverless endpoint
        const queryParams = new URLSearchParams({
          track: track.name,
          artist: artist,
        });

        const res = await fetch(`/api/audio/preview?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Unable to fetch audio preview");
        }

        const data = (await res.json()) as AudioPreviewResult;

        if (!data.previewUrl) {
          setIsLoadingAudio(false);
          setErrorMessage("Preview audio unavailable for this track");
          setTimeout(() => {
            setErrorMessage((prev) =>
              prev === "Preview audio unavailable for this track" ? null : prev
            );
          }, 3500);
          return;
        }

        // 4. Update preview and artwork state
        setPreviewUrl(data.previewUrl);
        setArtworkUrl(data.artworkUrl || null);

        // 5. Load and play new stream
        audio.src = data.previewUrl;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        console.warn(`[Audio] Failed to play preview for "${track.name}":`, err);
        setIsLoadingAudio(false);
        setIsPlaying(false);
        setErrorMessage("Audio preview unavailable");
        setTimeout(() => {
          setErrorMessage((prev) =>
            prev === "Audio preview unavailable" ? null : prev
          );
        }, 3500);
      }
    },
    []
  );

  const toggleTrack = useCallback(
    (track: NormalizedTrack, artist: string) => {
      // If clicking the currently active track, toggle playback
      if (
        activeTrack &&
        activeTrack.name.toLowerCase() === track.name.toLowerCase()
      ) {
        if (isPlaying) {
          pause();
        } else {
          resume();
        }
        return;
      }

      // If clicking a different track, play the new track
      playTrack(track, artist);
    },
    [activeTrack, isPlaying, pause, resume, playTrack]
  );

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (audio && !isNaN(seconds)) {
        const targetTime = Math.max(0, Math.min(seconds, duration || 30));
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
        setProgress(targetTime / (duration || 30));
      }
    },
    [duration]
  );

  return (
    <AudioContext.Provider
      value={{
        activeTrack,
        artistName,
        previewUrl,
        artworkUrl,
        isPlaying,
        isLoadingAudio,
        progress,
        currentTime,
        duration,
        errorMessage,
        playTrack,
        pause,
        resume,
        toggleTrack,
        seek,
        stop,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
