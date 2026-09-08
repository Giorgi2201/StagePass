"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Disc, Ticket, Flame, User } from "lucide-react";
import { tickHaptic } from "@/lib/haptics";

export type NavigationTab = "setlists" | "stubs" | "tours" | "profile";

export interface TabItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TABS: TabItem[] = [
  { id: "setlists", label: "Setlists", icon: Disc },
  { id: "stubs", label: "My Stubs", icon: Ticket },
  { id: "tours", label: "Tours", icon: Flame },
  { id: "profile", label: "Profile", icon: User },
];

export interface NavigationContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  tabs: TabItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<NavigationTab>("setlists");

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState((prev) => {
      if (prev !== tab) {
        tickHaptic();
      }
      return tab;
    });
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tabs: TABS,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
