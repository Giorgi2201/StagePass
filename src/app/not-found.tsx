import React from "react";
import Link from "next/link";
import { Disc3, ArrowLeft, Music2, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      <div className="relative z-10 max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Broken Vinyl Record Icon */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-neutral-900 border border-neutral-800 shadow-2xl" />
          <div className="relative w-16 h-16 rounded-full bg-[#141414] border border-neutral-700/60 flex items-center justify-center shadow-inner">
            <Disc3 className="w-9 h-9 text-neutral-500 animate-spin-slow" />
            <div className="absolute w-4 h-4 rounded-full bg-[#1DB954] shadow-sm flex items-center justify-center">
              <Music2 className="w-2.5 h-2.5 text-black" />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#1DB954]" />
            <span>404 • Track Not Found</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Concert Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
            The setlist or page you were looking for could not be found. The tour
            might have moved to another city or the URL took an unexpected encore.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Return to StagePass</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
