/**
 * Safe tactile haptic feedback utility for mobile touch interactions.
 * Gracefully no-ops if navigator.vibrate is unsupported or denied by browser policies.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently catch unsupported hardware or permissions errors
    }
  }
}

/**
 * 10ms micro-vibration for tab switches, mode changes, and artist selections
 */
export function lightTap(): void {
  vibrate(10);
}

/**
 * 20ms tactile pulse for track inclusion/exclusion toggles, theme switches, and modal triggers
 */
export function mediumTap(): void {
  vibrate(20);
}

/**
 * Distinct rhythmic sequence [15, 50, 25] for successful playlist creation or ticket export
 */
export function successPulse(): void {
  vibrate([15, 50, 25]);
}

/**
 * 8ms subtle micro-haptic tick for scrubbing/crossing tab boundaries
 */
export function tickHaptic(): void {
  vibrate(8);
}

