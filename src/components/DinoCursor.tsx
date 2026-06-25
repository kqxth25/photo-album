"use client";

import { useEffect, useRef } from "react";

/*
 * Glass Cursor — minimal, modern, spring-driven.
 * Inner: 7px solid white dot.
 * Outer: 22px glass ring with subtle glow.
 * Hover: ring expands ~18%, glow intensifies.
 * Click: ring contracts, ripple pulse.
 * Magnetic: buttons gently pull toward cursor.
 * All animation: transform + opacity @ 60fps.
 */

const INNER_SIZE = 7;
const OUTER_SIZE = 22;
const SPRING = 0.16;
const DAMPING = 0.7;
const HOVER_SCALE = 1.18;
const CLICK_SCALE = 0.82;
const MAGNET_DISTANCE = 40; // px, max magnetic pull range
const MAGNET_STRENGTH = 4; // px, max pull amount

interface CursorState {
  tx: number;
  ty: number;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  outerScale: number;
  targetOuterScale: number;
  isHover: boolean;
  isClicking: boolean;
  rippleOpacity: number;
  rippleScale: number;
  magnetX: number;
  magnetY: number;
}

export default function DinoCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const ripple = rippleRef.current;
    if (!outer || !inner || !ripple) return;

    // Hide system cursor
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";

    const state: CursorState = {
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      cx: window.innerWidth / 2,
      cy: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      outerScale: 1,
      targetOuterScale: 1,
      isHover: false,
      isClicking: false,
      rippleOpacity: 0,
      rippleScale: 0.5,
      magnetX: 0,
      magnetY: 0,
    };

    // ── Magnetic hover tracking ──
    let magneticTarget: HTMLElement | null = null;
    let magneticRect: DOMRect | null = null;

    const findInteractive = (el: Element): HTMLElement | null => {
      return el.closest(
        'button, a, [role="button"], input, textarea, [data-interactive]'
      ) as HTMLElement | null;
    };

    // ── Mouse move ──
    const onMouseMove = (e: MouseEvent) => {
      state.tx = e.clientX;
      state.ty = e.clientY;

      // Hover detection
      const interactive = findInteractive(e.target as Element);
      if (interactive && !state.isHover) {
        state.isHover = true;
        state.targetOuterScale = HOVER_SCALE;
        magneticTarget = interactive;
      } else if (!interactive && state.isHover) {
        state.isHover = false;
        state.targetOuterScale = 1;
        magneticTarget = null;
      }

      // Magnetic rect
      if (magneticTarget) {
        magneticRect = magneticTarget.getBoundingClientRect();
      } else {
        magneticRect = null;
      }
    };

    // ── Click ──
    const onMouseDown = () => {
      state.isClicking = true;
      state.targetOuterScale = CLICK_SCALE;

      // Trigger ripple at cursor position
      ripple.style.left = `${state.cx}px`;
      ripple.style.top = `${state.cy}px`;
      state.rippleOpacity = 0.25;
      state.rippleScale = 0.3;
    };

    const onMouseUp = () => {
      state.isClicking = false;
      state.targetOuterScale = state.isHover ? HOVER_SCALE : 1;
    };

    // ── RAF loop ──
    const animate = () => {
      // Magnetic pull
      let mx = 0;
      let my = 0;
      if (magneticRect && state.isHover) {
        const bx = magneticRect.left + magneticRect.width / 2;
        const by = magneticRect.top + magneticRect.height / 2;
        const dx = bx - state.cx;
        const dy = by - state.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAGNET_DISTANCE + Math.max(magneticRect.width, magneticRect.height) / 2 && dist > 0.1) {
          const strength = Math.min(
            MAGNET_STRENGTH,
            (1 - dist / (MAGNET_DISTANCE + Math.max(magneticRect.width, magneticRect.height) / 2)) * MAGNET_STRENGTH
          );
          mx = (dx / dist) * strength;
          my = (dy / dist) * strength;
        }
      }

      // Spring: apply magnetic pull to target
      const effectiveTx = state.tx + mx;
      const effectiveTy = state.ty + my;

      state.vx += (effectiveTx - state.cx) * SPRING;
      state.vy += (effectiveTy - state.cy) * SPRING;
      state.vx *= DAMPING;
      state.vy *= DAMPING;
      state.cx += state.vx;
      state.cy += state.vy;

      // Outer ring scale spring
      state.outerScale +=
        (state.targetOuterScale - state.outerScale) * 0.22;

      // Ripple decay
      state.rippleOpacity *= 0.88;
      state.rippleScale += (2.5 - state.rippleScale) * 0.35;

      // ── Write to DOM ──
      // Outer ring
      outer.style.transform = `translate3d(${state.cx}px, ${state.cy}px, 0) scale(${state.outerScale})`;
      outer.style.opacity = state.isHover ? "1" : "0.75";

      // Inner dot (always centered, no scaling)
      inner.style.transform = `translate3d(${state.cx}px, ${state.cy}px, 0)`;

      // Ripple
      ripple.style.transform = `translate3d(${state.cx}px, ${state.cy}px, 0) scale(${state.rippleScale})`;
      ripple.style.opacity = String(state.rippleOpacity);

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    requestAnimationFrame(animate);

    return () => {
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      {/* Ripple pulse */}
      <div
        ref={rippleRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: OUTER_SIZE,
          height: OUTER_SIZE,
          marginLeft: -OUTER_SIZE / 2,
          marginTop: -OUTER_SIZE / 2,
          pointerEvents: "none",
          zIndex: 99997,
          opacity: 0,
          willChange: "transform, opacity",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(126,169,255,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Outer glass ring */}
      <div
        ref={outerRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: OUTER_SIZE,
          height: OUTER_SIZE,
          marginLeft: -OUTER_SIZE / 2,
          marginTop: -OUTER_SIZE / 2,
          pointerEvents: "none",
          zIndex: 99998,
          opacity: 0.75,
          willChange: "transform, opacity",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "0 0 8px rgba(255,255,255,0.06), 0 0 18px rgba(126,169,255,0.08), 0 0 2px rgba(255,255,255,0.1)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* Inner white dot */}
      <div
        ref={innerRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: INNER_SIZE,
          height: INNER_SIZE,
          marginLeft: -INNER_SIZE / 2,
          marginTop: -INNER_SIZE / 2,
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow:
            "0 0 4px rgba(255,255,255,0.4), 0 0 8px rgba(255,255,255,0.15)",
        }}
      />
    </>
  );
}
