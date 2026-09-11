"use client";

import { useCallback } from "react";

interface ScrollFadeOptions {
  fadeSize?: number;
}

/**
 * Custom React hook that dynamically computes scroll edge boundaries
 * and smoothly applies/removes two-sided fade masks via CSS typed properties.
 *
 * Returns a ref callback function compatible with React 19 compiler rules.
 */
export function useScrollFade<T extends HTMLElement = HTMLDivElement>(
  options: ScrollFadeOptions = {}
) {
  const fadeSize = options.fadeSize ?? 24;

  const callbackRef = useCallback(
    (el: T | null) => {
      if (!el) return;

      const updateFade = () => {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxScroll = scrollWidth - clientWidth;

        // If content fits without horizontal scroll
        if (maxScroll <= 3) {
          el.style.setProperty("--fade-left-size", "0px");
          el.style.setProperty("--fade-right-size", "0px");
          return;
        }

        const canScrollLeft = scrollLeft > 4;
        const canScrollRight = scrollLeft < maxScroll - 4;

        el.style.setProperty("--fade-left-size", canScrollLeft ? `${fadeSize}px` : "0px");
        el.style.setProperty("--fade-right-size", canScrollRight ? `${fadeSize}px` : "0px");
      };

      // Initial calculation
      updateFade();

      let rAFId: number | null = null;
      const handleScroll = () => {
        if (rAFId !== null) cancelAnimationFrame(rAFId);
        rAFId = requestAnimationFrame(() => {
          updateFade();
          rAFId = null;
        });
      };

      el.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", updateFade);

      const resizeObserver = new ResizeObserver(updateFade);
      resizeObserver.observe(el);

      const mutationObserver = new MutationObserver(updateFade);
      mutationObserver.observe(el, { childList: true, subtree: true });

      // Clean up when element is unmounted or replaced
      const cleanup = () => {
        if (rAFId !== null) cancelAnimationFrame(rAFId);
        el.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", updateFade);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };

      // Attach cleanup to node for React's ref unmount callback or garbage collection
      (el as unknown as { _scrollFadeCleanup?: () => void })._scrollFadeCleanup = cleanup;
    },
    [fadeSize]
  );

  return callbackRef;
}
