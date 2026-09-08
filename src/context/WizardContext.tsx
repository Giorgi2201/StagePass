"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  NormalizedArtist,
  NormalizedShow,
  SetlistParseResult,
} from "@/types/setlist";
import type { CreatePlaylistResponse } from "@/types/spotify";
import { useAuth } from "@/context/AuthContext";

export type WizardStep = "search" | "shows" | "review" | "success";
export type WizardMode = "rehearsal" | "memory" | "essential";

interface WizardContextType {
  step: WizardStep;
  mode: WizardMode;
  artistQuery: string;
  selectedArtist: NormalizedArtist | null;
  selectedShow: NormalizedShow | null;
  parseResult: SetlistParseResult | null;
  isLoadingParse: boolean;
  excludedTrackIndices: Set<number>;
  playlistTitle: string;
  isPublic: boolean;
  isGenerating: boolean;
  generationStatus: string;
  creationResult: CreatePlaylistResponse | null;
  errorMessage: string | null;

  setMode: (mode: WizardMode) => void;
  setArtistQuery: (query: string) => void;
  selectArtist: (artist: NormalizedArtist) => void;
  selectShow: (show: NormalizedShow) => Promise<void>;
  generateRehearsalSetlist: (artistOverride?: NormalizedArtist) => Promise<void>;
  generateEssentialHits: () => Promise<void>;
  toggleTrack: (index: number) => void;
  setPlaylistTitle: (title: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  createPlaylist: () => Promise<void>;
  goToStep: (step: WizardStep) => void;
  goBack: () => void;
  resetWizard: () => void;
  savePendingWizardState: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface PendingWizardBackup {
  selectedArtist?: NormalizedArtist | null;
  selectedShow?: NormalizedShow | null;
  parseResult?: SetlistParseResult | null;
  mode?: WizardMode;
  playlistTitle?: string;
  excludedTrackIndices?: number[];
}

function getPendingWizardBackup(): PendingWizardBackup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("stagepass_pending_wizard");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.parseResult ? data : null;
  } catch {
    return null;
  }
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [initialBackup] = useState<PendingWizardBackup | null>(getPendingWizardBackup);

  const [step, setStep] = useState<WizardStep>(() =>
    initialBackup?.parseResult ? "review" : "search"
  );
  const [mode, setModeState] = useState<WizardMode>(() =>
    initialBackup?.mode || "rehearsal"
  );
  const [artistQuery, setArtistQuery] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<NormalizedArtist | null>(() =>
    initialBackup?.selectedArtist || null
  );
  const [selectedShow, setSelectedShow] = useState<NormalizedShow | null>(() =>
    initialBackup?.selectedShow || null
  );
  const [parseResult, setParseResult] = useState<SetlistParseResult | null>(() =>
    initialBackup?.parseResult || null
  );
  const [isLoadingParse, setIsLoadingParse] = useState<boolean>(false);
  const [excludedTrackIndices, setExcludedTrackIndices] = useState<Set<number>>(() =>
    initialBackup?.excludedTrackIndices
      ? new Set(initialBackup.excludedTrackIndices)
      : new Set()
  );
  const [playlistTitle, setPlaylistTitle] = useState<string>(() =>
    initialBackup?.playlistTitle || ""
  );
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [creationResult, setCreationResult] =
    useState<CreatePlaylistResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  const savePendingWizardState = useCallback(() => {
    if (typeof window === "undefined" || !parseResult) return;
    try {
      const data = {
        selectedArtist,
        selectedShow,
        parseResult,
        mode,
        playlistTitle,
        excludedTrackIndices: Array.from(excludedTrackIndices),
        savedAt: Date.now(),
      };
      sessionStorage.setItem("stagepass_pending_wizard", JSON.stringify(data));
    } catch (err) {
      console.warn("Failed to serialize wizard state to sessionStorage:", err);
    }
  }, [
    selectedArtist,
    selectedShow,
    parseResult,
    mode,
    playlistTitle,
    excludedTrackIndices,
  ]);

  // Clear backup from sessionStorage once authentication completes successfully
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined") {
      sessionStorage.removeItem("stagepass_pending_wizard");
    }
  }, [isAuthenticated]);

  const setMode = useCallback((newMode: WizardMode) => {
    setModeState(newMode);
    // Reset downstream show/parse results if switching mode
    setSelectedShow(null);
    setParseResult(null);
    setExcludedTrackIndices(new Set());
  }, []);

  const selectArtist = useCallback((artist: NormalizedArtist) => {
    setSelectedArtist(artist);
    setSelectedShow(null);
    setParseResult(null);
    setExcludedTrackIndices(new Set());
    setErrorMessage(null);
    setStep("shows");
  }, []);

  const selectShow = useCallback(
    async (show: NormalizedShow) => {
      setSelectedShow(show);
      setIsLoadingParse(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/setlist/parse?mode=memory&setlistId=${encodeURIComponent(
            show.id
          )}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load show setlist");
        }

        const data: SetlistParseResult = await response.json();
        setParseResult(data);
        setExcludedTrackIndices(new Set());

        // Default title: e.g. "Radiohead • Madison Square Garden (15-08-2024)"
        const defaultTitle = `${data.artistName} • ${show.venueName || "Live"} (${show.eventDate})`;
        setPlaylistTitle(defaultTitle);
        setStep("review");
      } catch (err) {
        console.error("Error loading setlist:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load setlist"
        );
      } finally {
        setIsLoadingParse(false);
      }
    },
    []
  );

  const generateRehearsalSetlist = useCallback(
    async (artistOverride?: NormalizedArtist) => {
      const targetArtist = artistOverride || selectedArtist;
      if (!targetArtist) return;

      if (artistOverride) {
        setSelectedArtist(artistOverride);
        setModeState("rehearsal");
        setSelectedShow(null);
      }

      setIsLoadingParse(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/setlist/parse?mode=rehearsal&mbid=${encodeURIComponent(
            targetArtist.id
          )}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error || "Failed to calculate rehearsal consensus"
          );
        }

        const data: SetlistParseResult = await response.json();
        setParseResult(data);
        setExcludedTrackIndices(new Set());

        // Default title: e.g. "Coldplay • Tour Rehearsal Setlist"
        const defaultTitle = `${data.artistName} • ${data.tourName || "Tour"} Rehearsal Setlist`;
        setPlaylistTitle(defaultTitle);
        setStep("review");
      } catch (err) {
        console.error("Error generating rehearsal setlist:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to generate tour rehearsal setlist"
        );
      } finally {
        setIsLoadingParse(false);
      }
    },
    [selectedArtist]
  );

  const generateEssentialHits = useCallback(async () => {
    if (!selectedArtist) return;

    setIsLoadingParse(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/spotify/artist-top-tracks?artistName=${encodeURIComponent(
          selectedArtist.name
        )}`
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "Failed to curate essential hits collection"
        );
      }

      const data: SetlistParseResult = await response.json();
      setParseResult(data);
      setModeState("essential");
      setExcludedTrackIndices(new Set());

      // Pre-fill editable title: e.g. "[Artist] • Essential Hits & Fan Favorites"
      const defaultTitle = `${data.artistName} • Essential Hits & Fan Favorites`;
      setPlaylistTitle(defaultTitle);
      setStep("review");
    } catch (err) {
      console.error("Error generating essential hits:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to generate artist's essential hits"
      );
    } finally {
      setIsLoadingParse(false);
    }
  }, [selectedArtist]);

  const toggleTrack = useCallback((index: number) => {
    setExcludedTrackIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const createPlaylist = useCallback(async () => {
    if (!parseResult || !selectedArtist) return;

    // Filter out excluded tracks
    const activeTracks = parseResult.tracks.filter(
      (_, index) => !excludedTrackIndices.has(index)
    );

    if (activeTracks.length === 0) {
      setErrorMessage("Please select at least one track to include in the playlist.");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Matching tracks in Spotify catalog...");
    setErrorMessage(null);

    try {
      // Transition to success screen right away to display real-time animation
      setStep("success");

      setTimeout(() => {
        setGenerationStatus("Creating playlist in your Spotify library...");
      }, 900);

      const response = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concertTitle: playlistTitle.trim() || `${parseResult.artistName} Live Setlist`,
          description: `Generated with StagePass • ${parseResult.venueInfo || "Concert Setlist"} • ${activeTracks.length} tracks`,
          isPublic,
          performingArtist: selectedArtist.name,
          tracks: activeTracks,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create Spotify playlist");
      }

      setGenerationStatus("Adding tracks...");
      const data: CreatePlaylistResponse = await response.json();
      setCreationResult(data);
    } catch (err) {
      console.error("Error creating playlist:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create Spotify playlist"
      );
      // Fall back to review so user can retry
      setStep("review");
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  }, [parseResult, selectedArtist, excludedTrackIndices, playlistTitle, isPublic]);

  const goBack = useCallback(() => {
    setErrorMessage(null);
    if (step === "shows") {
      setStep("search");
    } else if (step === "review") {
      setStep("shows");
    } else if (step === "success") {
      setStep("review");
    }
  }, [step]);

  const resetWizard = useCallback(() => {
    setStep("search");
    setArtistQuery("");
    setSelectedArtist(null);
    setSelectedShow(null);
    setParseResult(null);
    setExcludedTrackIndices(new Set());
    setPlaylistTitle("");
    setIsPublic(false);
    setIsGenerating(false);
    setGenerationStatus("");
    setCreationResult(null);
    setErrorMessage(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("stagepass_pending_wizard");
    }
  }, []);

  return (
    <WizardContext.Provider
      value={{
        step,
        mode,
        artistQuery,
        selectedArtist,
        selectedShow,
        parseResult,
        isLoadingParse,
        excludedTrackIndices,
        playlistTitle,
        isPublic,
        isGenerating,
        generationStatus,
        creationResult,
        errorMessage,

        setMode,
        setArtistQuery,
        selectArtist,
        selectShow,
        generateRehearsalSetlist,
        generateEssentialHits,
        toggleTrack,
        setPlaylistTitle,
        setIsPublic,
        createPlaylist,
        goToStep: setStep,
        goBack,
        resetWizard,
        savePendingWizardState,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextType {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
