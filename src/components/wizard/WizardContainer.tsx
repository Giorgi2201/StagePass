"use client";

import React from "react";
import { useWizard, WIZARD_STEPS } from "@/context/WizardContext";
import { StepSearch } from "./StepSearch";
import { StepShows } from "./StepShows";
import { StepReview } from "./StepReview";
import { StepSuccess } from "./StepSuccess";
import { Check } from "lucide-react";

export function WizardContainer() {
  const { step } = useWizard();

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Step Progress Stepper */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 pb-3 sm:pb-5 select-none">
        {WIZARD_STEPS.map((s, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={s.id} className="flex-1 flex flex-col gap-2 min-w-0">
              {/* Progress Bar Segment */}
              <div className="w-full h-1 sm:h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? "bg-[#1DB954] w-full"
                      : "bg-transparent w-0"
                  }`}
                />
              </div>

              {/* Step Badge & Label */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-1.5 text-center sm:text-left min-w-0">
                {isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#1DB954]" />
                  </div>
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[9px] sm:text-[10px] flex items-center justify-center font-mono font-bold shrink-0 transition-all ${
                      isCurrent
                        ? "bg-[#1DB954] text-black shadow-[0_0_8px_rgba(29,185,84,0.35)]"
                        : "bg-neutral-800 text-zinc-500 border border-white/5"
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}

                <span
                  className={`text-[9.5px] min-[390px]:text-[10px] sm:text-xs font-semibold tracking-tight transition-colors leading-tight truncate sm:truncate-none ${
                    isCurrent
                      ? "text-white font-bold"
                      : isCompleted
                      ? "text-[#1DB954]"
                      : "text-zinc-500"
                  }`}
                  title={s.label}
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
