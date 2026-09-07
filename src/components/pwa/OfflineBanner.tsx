"use client";

import React, { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );
  const isOffline = !isOnline;

  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Transitioned from offline to online
      wasOfflineRef.current = false;
      const showTimer = setTimeout(() => {
        setShowReconnected(true);
      }, 0);
      const hideTimer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOffline]);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md w-auto px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-300 pointer-events-auto"
    >
      {isOffline ? (
        <div className="flex items-center gap-2.5 bg-neutral-900/90 border-amber-500/50 text-amber-200 text-xs font-semibold px-1">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">
            You&apos;re currently offline. Cached setlists remain accessible.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-neutral-900/90 border-[#1DB954]/50 text-emerald-300 text-xs font-semibold px-1">
          <Wifi className="w-4 h-4 text-[#1DB954] shrink-0" />
          <span>Back online</span>
        </div>
      )}
    </aside>
  );
}
