"use client";

import React from "react";
import { useWizard } from "@/context/WizardContext";
import { StepSearch } from "./StepSearch";
import { StepShows } from "./StepShows";
import { StepReview } from "./StepReview";
import { StepSuccess } from "./StepSuccess";
import { Check } from "lucide-react";

const STEPS = [
  { id: "search", label: "Artist & Mode" },
  { id: "shows", label: "Tour & Show" },
  { id: "review", label: "Review Setlist" },
  { id: "success", label: "Spotify Playlist" },
] as const;

export function WizardContainer() {
  const { step } = useWizard();

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="w-full space-y-6">
      {/* Spotify Minimal Step Progress Track */}
      <div className="flex items-center justify-between gap-1 pb-4">
        {STEPS.map((s, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Progress Bar Segment */}
              <div className="w-full h-1 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? "bg-[#1DB954] w-full"
                      : "bg-transparent w-0"
                  }`}
                />
              </div>

              {/* Step Label */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold">
                {isCompleted ? (
                  <Check className="w-3 h-3 text-[#1DB954]" />
                ) : (
                  <span
                    className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-mono ${
                      isCurrent
                        ? "bg-[#1DB954] text-black"
                        : "bg-neutral-800 text-zinc-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                <span
                  className={
                    isCurrent
                      ? "text-white"
                      : isCompleted
                      ? "text-[#1DB954]"
                      : "text-zinc-600"
                  }
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render Active Step Component */}
      <div className="min-h-[420px]">
        {step === "search" && <StepSearch />}
        {step === "shows" && <StepShows />}
        {step === "review" && <StepReview />}
        {step === "success" && <StepSuccess />}
      </div>
    </div>
  );
}
