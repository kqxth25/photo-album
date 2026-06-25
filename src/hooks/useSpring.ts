"use client";

import { useRef, useEffect, useCallback } from "react";

interface SpringConfig {
  stiffness: number;
  damping: number;
  precision: number;
}

const defaults: SpringConfig = {
  stiffness: 0.15,
  damping: 0.7,
  precision: 0.001,
};

/**
 * Spring physics simulation. Returns a RefObject<number> that animates
 * toward `target` via requestAnimationFrame. No React re-renders — read
 * `.current` in your own RAF loop or event handler.
 *
 * Config presets:
 *   tilt return:  { stiffness: 0.06, damping: 0.8 }
 *   hover:        { stiffness: 0.25, damping: 0.8 }
 *   parallax:     { stiffness: 0.1, damping: 0.7 }
 *   instant:      { stiffness: 0.4, damping: 0.85 }
 */
export function useSpring(
  target: number,
  config: Partial<SpringConfig> = {}
) {
  const cfg = { ...defaults, ...config };
  const current = useRef(target);
  const velocity = useRef(0);
  const targetRef = useRef(target);
  const rafRef = useRef(0);

  targetRef.current = target;

  const loop = useCallback(() => {
    const diff = targetRef.current - current.current;
    velocity.current += diff * cfg.stiffness;
    velocity.current *= cfg.damping;
    current.current += velocity.current;

    if (
      Math.abs(diff) > cfg.precision ||
      Math.abs(velocity.current) > cfg.precision
    ) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      current.current = targetRef.current;
      velocity.current = 0;
    }
  }, [cfg.stiffness, cfg.damping, cfg.precision]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  return current;
}

export const springPresets = {
  tilt: { stiffness: 0.06, damping: 0.8 },
  hover: { stiffness: 0.25, damping: 0.8 },
  parallax: { stiffness: 0.1, damping: 0.7 },
  instant: { stiffness: 0.4, damping: 0.85 },
  gentle: { stiffness: 0.08, damping: 0.75 },
};
