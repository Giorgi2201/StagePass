"use client";

import React from "react";

export interface StagePassLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * StagePass Scalable Vector Brand Logo
 * Features the exact backstage pass badge emblem with side notches,
 * top lanyard slot, and 5 central audio soundwave bars in Spotify Green.
 */
export function StagePassLogo({
  className = "w-8 h-8",
  size,
  ...props
}: StagePassLogoProps) {
  const id = React.useId().replace(/:/g, "");
  const glowGradId = `spGlowGrad-${id}`;

  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="160 112 192 288"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...dimensionProps}
      {...props}
    >
      <defs>
        <linearGradient id={glowGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#1ed760" />
          <stop offset="100%" stopColor="#1DB954" />
        </linearGradient>
      </defs>

      {/* Ticket / Stage Pass Badge Shape */}
      <path
        d="M176 160 C176 142 190 128 208 128 L304 128 C322 128 336 142 336 160 L336 216 C320 216 308 228 308 244 C308 260 320 272 336 272 L336 352 C336 370 322 384 304 384 L208 384 C190 384 176 370 176 352 L176 272 C192 272 204 260 204 244 C204 228 192 216 176 216 Z"
        fill="#101411"
        stroke={`url(#${glowGradId})`}
        strokeWidth="10"
      />

      {/* Pass Neck Hole / Lanyard Slot */}
      <rect
        x="232"
        y="152"
        width="48"
        height="12"
        rx="6"
        fill={`url(#${glowGradId})`}
      />

      {/* Center Audio Wave (5 Vertical Bars) */}
      <path
        d="M216 280 L216 240 M236 300 L236 220 M256 312 L256 208 M276 300 L276 220 M296 280 L296 240"
        stroke={`url(#${glowGradId})`}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}
