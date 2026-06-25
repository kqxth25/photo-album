"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface InViewOptions {
  threshold?: number;
  once?: boolean;
  delay?: number;
}

/**
 * IntersectionObserver trigger → spring-animated progress (0→1).
 * Returns a number suitable for entryStyle() or manual use.
 * The spring animation runs via requestAnimationFrame, updating
 * React state each frame until settled at 1.
 */
export function useInView(options: InViewOptions = {}) {
  const { threshold = 0.1, once = true, delay = 0 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState(0);       // 0 or 1
  const [value, setValue] = useState(0);          // spring output

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setTarget(1), delay);
          } else {
            setTarget(1);
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          setTarget(0);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, delay]);

  // Spring simulation
  useEffect(() => {
    if (target === value && target === 0) return;
    if (target === value && target === 1 && value > 0.999) return;

    let current = value;
    let velocity = 0;
    const stiffness = 0.08;
    const damping = 0.7;
    let raf = 0;

    const animate = () => {
      const diff = target - current;
      velocity += diff * stiffness;
      velocity *= damping;
      current += velocity;

      const settled =
        Math.abs(diff) < 0.001 && Math.abs(velocity) < 0.001;

      if (settled) {
        current = target;
        setValue(target);
        return;
      }

      setValue(current);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return { ref, progress: value };
}

/**
 * Map spring progress (0→1) to a composite entry animation style.
 * Combines opacity, translateY, scale, and blur.
 * When progress = 1, all effects resolve to identity (no transform cost).
 */
export function entryStyle(progress: number): React.CSSProperties {
  if (progress >= 1) return {};
  const p = Math.max(0, Math.min(1, progress));
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 24}px) scale(${0.92 + p * 0.08})`,
    filter: p < 0.98 ? `blur(${(1 - p) * 6}px)` : undefined,
  };
}
