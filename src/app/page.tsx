"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { WizardProvider } from "@/context/WizardContext";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { StubsView } from "@/components/views/StubsView";
import { ToursView } from "@/components/views/ToursView";
import { ProfileView } from "@/components/views/ProfileView";
import { BetaAccessModal } from "@/components/modals/BetaAccessModal";

export default function Home() {
  const { isLoading } = useAuth();
  const { activeTab } = useNavigation();

  return (
    <WizardProvider>
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#181818] via-[#121212] to-[#121212]">
        {/* Inline Document Skeleton */}
        {isLoading ? (
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] animate-pulse space-y-4">
              <div className="h-6 w-36 bg-[#242424] rounded-full" />
              <div className="h-10 w-2/3 bg-[#242424] rounded-lg" />
              <div className="h-4 w-1/2 bg-[#242424] rounded" />
            </div>
          </main>
        ) : activeTab === "stubs" ? (
          /* =========================================================
              MY STUBS ARCHIVE TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <StubsView />
            </div>
          </main>
        ) : activeTab === "tours" ? (
          /* =========================================================
              TRENDING TOURS TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <ToursView />
            </div>
          </main>
        ) : activeTab === "profile" ? (
          /* =========================================================
              USER PROFILE & SETTINGS TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <ProfileView />
            </div>
          </main>
        ) : (
          /* =========================================================
              SETLISTS TAB VIEW: WIZARD WORKSPACE (ACCESSIBLE TO ALL)
              Clean, distraction-free application workspace accessible
              to authenticated users and guests alike.
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-28 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <WizardContainer />
            </div>
          </main>
        )}

        {/* Spotify Developer Mode / Closed Beta Access Modal */}
        <BetaAccessModal />
      </div>
    </WizardProvider>
  );
}
