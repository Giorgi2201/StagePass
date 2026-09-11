"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { WizardProvider } from "@/context/WizardContext";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { useAudio } from "@/context/AudioContext";
import { StubsView } from "@/components/views/StubsView";
import { ToursView } from "@/components/views/ToursView";
import { ProfileView } from "@/components/views/ProfileView";
import { BetaAccessModal } from "@/components/modals/BetaAccessModal";

export default function Home() {
  const { isLoading } = useAuth();
  const { activeTab } = useNavigation();
  const { activeTrack } = useAudio();

  // Dynamic outer scroll clearance: pb-40 on mobile when mini-player is docked, pb-28 when idle
  const mainScrollClass = `w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-4 md:py-8 ${
    activeTrack ? "pb-40" : "pb-28"
  } md:pb-12 flex-1 flex flex-col relative z-10 transition-all duration-300`;

  return (
    <WizardProvider>
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#181818] via-[#121212] to-[#121212]">
        {/* Inline Document Skeleton */}
        {isLoading ? (
          <main className={mainScrollClass}>
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-36 bg-[#242424] rounded-full" />
              <div className="h-10 w-2/3 bg-[#242424] rounded-lg" />
              <div className="h-4 w-1/2 bg-[#242424] rounded" />
            </div>
          </main>
        ) : activeTab === "stubs" ? (
          /* =========================================================
              MY STUBS ARCHIVE TAB VIEW
             ========================================================= */
          <main className={mainScrollClass}>
            <StubsView />
          </main>
        ) : activeTab === "tours" ? (
          /* =========================================================
              TRENDING TOURS TAB VIEW
             ========================================================= */
          <main className={mainScrollClass}>
            <ToursView />
          </main>
        ) : activeTab === "profile" ? (
          /* =========================================================
              USER PROFILE & SETTINGS TAB VIEW
             ========================================================= */
          <main className={mainScrollClass}>
            <ProfileView />
          </main>
        ) : (
          /* =========================================================
              SETLISTS TAB VIEW: WIZARD WORKSPACE (ACCESSIBLE TO ALL)
              Clean, distraction-free application workspace accessible
              to authenticated users and guests alike.
             ========================================================= */
          <main className={mainScrollClass}>
            <WizardContainer />
          </main>
        )}

        {/* Spotify Developer Mode / Closed Beta Access Modal */}
        <BetaAccessModal />
      </div>
    </WizardProvider>
  );
}
