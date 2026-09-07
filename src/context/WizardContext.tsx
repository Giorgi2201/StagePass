"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type {
  NormalizedArtist,
  NormalizedShow,
  SetlistParseResult,
} from "@/types/setlist";
import type { CreatePlaylistResponse } from "@/types/spotify";

export type WizardStep = "search" | "shows" | "review" | "success";
export type WizardMode = "rehearsal" | "memory";

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
  generateRehearsalSetlist: () => Promise<void>;
  toggleTrack: (index: number) => void;
  setPlaylistTitle: (title: string) => void;
  setIsPublic: (isPublic: boolean) => void;
  createPlaylist: () => Promise<void>;
  goToStep: (step: WizardStep) => void;
  goBack: () => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<WizardStep>("search");
  const [mode, setModeState] = useState<WizardMode>("rehearsal");
  const [artistQuery, setArtistQuery] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<NormalizedArtist | null>(
    null
  );
  const [selectedShow, setSelectedShow] = useState<NormalizedShow | null>(null);
  const [parseResult, setParseResult] = useState<SetlistParseResult | null>(
    null
  );
  const [isLoadingParse, setIsLoadingParse] = useState<boolean>(false);
  const [excludedTrackIndices, setExcludedTrackIndices] = useState<Set<number>>(
    new Set()
  );
  const [playlistTitle, setPlaylistTitle] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [creationResult, setCreationResult] =
    useState<CreatePlaylistResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const generateRehearsalSetlist = useCallback(async () => {
    if (!selectedArtist) return;

    setIsLoadingParse(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/setlist/parse?mode=rehearsal&mbid=${encodeURIComponent(
          selectedArtist.id
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
        toggleTrack,
        setPlaylistTitle,
        setIsPublic,
        createPlaylist,
        goToStep: setStep,
        goBack,
        resetWizard,
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
