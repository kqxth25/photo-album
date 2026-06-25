"use client";

import { useRef, useEffect } from "react";
import { useSpring, springPresets } from "./useSpring";

/**
 * Scroll-driven parallax effect.
 * Returns a ref to attach and the current translateY offset.
 *
 * @param speed - Multiplier relative to scroll speed (0 = fixed, 1 = normal, 0.5 = half)
 */
export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement | null>(null);
  const offset = useSpring(0, {
    stiffness: springPresets.parallax.stiffness,
    damping: springPresets.parallax.damping,
  });
  const rafRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastScrollY = window.scrollY;

    const onScroll = () => {
      lastScrollY = window.scrollY;
    };

    const write = () => {
      // How much of the element is visible on screen
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const elementTop = rect.top;
      const scrollProgress = (windowH - elementTop) / (windowH + rect.height);
      const clamped = Math.max(0, Math.min(1, scrollProgress));

      // Parallax offset: when element enters viewport, shift background
      const yOffset = (clamped - 0.5) * 40 * speed;
      offset.current = yOffset;

      el.style.transform = `translateY(${offset.current}px)`;
      rafRef.current = requestAnimationFrame(write);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(write);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return { ref, offset };
}

/**
 * Simpler scroll-driven translation for the main content area.
 * Creates a subtle depth effect as user scrolls.
 */
export function useScrollOffset(multiplier: number = 0.3) {
  const springVal = useSpring(0, {
    stiffness: springPresets.parallax.stiffness,
    damping: springPresets.parallax.damping,
  });
  const rafRef = useRef(0);

  useEffect(() => {
    let target = 0;

    const onScroll = () => {
      target = window.scrollY * multiplier;
      springVal.current = target;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [multiplier]);

  // Return a ref that consumers read in their own RAF
  return springVal;
}
