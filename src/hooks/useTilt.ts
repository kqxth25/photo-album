"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSpring, springPresets } from "./useSpring";

interface TiltOptions {
  /** Max tilt angle in degrees. Default: 6 */
  maxTilt?: number;
  /** CSS perspective in px. Default: 800 */
  perspective?: number;
  /** Spring config for mouse-leave return animation */
  springStiffness?: number;
  springDamping?: number;
}

interface TiltResult {
  /** Attach to the card element via ref */
  cardRef: React.RefObject<HTMLDivElement | null>;
  /** Inline style for the card wrapper */
  cardStyle: React.CSSProperties;
  /** Inline style for the glass highlight overlay */
  highlightStyle: React.CSSProperties;
  /** Call on mouse move over the card */
  onMouseMove: (e: React.MouseEvent) => void;
  /** Call on mouse leave */
  onMouseLeave: () => void;
}

/**
 * 3D Perspective Tilt + dynamic glass highlight.
 * Mouse-driven rotateX/rotateY (±maxTilt°) with spring decay on leave.
 * Glass highlight is a radial-gradient that follows the cursor.
 * All animation via transform/opacity for 60fps.
 */
export function useTilt(options: TiltOptions = {}): TiltResult {
  const {
    maxTilt = 6,
    perspective = 800,
    springStiffness = springPresets.tilt.stiffness,
    springDamping = springPresets.tilt.damping,
  } = options;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const rotateX = useSpring(0, { stiffness: springStiffness, damping: springDamping });
  const rotateY = useSpring(0, { stiffness: springStiffness, damping: springDamping });
  const glowX = useSpring(50, { stiffness: 0.3, damping: 0.85 });
  const glowY = useSpring(50, { stiffness: 0.3, damping: 0.85 });
  const scale = useSpring(1, { stiffness: 0.15, damping: 0.75 });
  const rafRef = useRef(0);
  const styleRef = useRef<HTMLDivElement | null>(null);

  // Write spring values directly to DOM for performance (no React re-renders)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const write = () => {
      const rx = rotateX.current;
      const ry = rotateY.current;
      const sc = scale.current;
      const gx = glowX.current;
      const gy = glowY.current;

      el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${sc},${sc},1)`;
      el.style.transformStyle = "preserve-3d";
      el.style.willChange = "transform";

      // Update highlight overlay if present
      const hl = el.querySelector("[data-glass-highlight]") as HTMLElement | null;
      if (hl) {
        hl.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 50%, transparent 70%)`;
      }

      rafRef.current = requestAnimationFrame(write);
    };

    rafRef.current = requestAnimationFrame(write);
    return () => cancelAnimationFrame(rafRef.current);
  }, [perspective]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0..1
      const y = (e.clientY - rect.top) / rect.height;    // 0..1

      // Tilt: center is 0, edges are ±maxTilt
      rotateY.current = (x - 0.5) * 2 * maxTilt;
      rotateX.current = (y - 0.5) * -2 * maxTilt;

      // Glow follows cursor
      glowX.current = x * 100;
      glowY.current = y * 100;
    },
    [maxTilt]
  );

  const onMouseLeave = useCallback(() => {
    rotateY.current = 0;
    rotateX.current = 0;
    scale.current = 1;
    glowX.current = 50;
    glowY.current = 50;
  }, []);

  const onMouseEnter = useCallback(() => {
    scale.current = 1.02;
  }, []);

  const cardStyle: React.CSSProperties = {
    transition: "none",
    transformStyle: "preserve-3d",
  };

  const highlightStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 2,
    borderRadius: "inherit",
    background:
      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
  };

  return {
    cardRef,
    cardStyle,
    highlightStyle,
    onMouseMove,
    onMouseLeave,
    onMouseEnter: onMouseEnter as unknown as () => void,
  } as TiltResult & { onMouseEnter: () => void };
}
