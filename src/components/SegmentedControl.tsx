"use client";

import { useRef, useEffect, useCallback } from "react";

export interface SegmentedItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

interface Props {
  items: SegmentedItem[];
  active: string;
  onChange: (key: string) => void;
}

export default function SegmentedControl({ items, active, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const moveCapsule = useCallback(() => {
    const capsule = capsuleRef.current;
    const activeBtn = itemRefs.current.get(active);
    if (!capsule || !activeBtn) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    if (!containerRect) return;

    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    capsule.style.transform = `translateX(${left}px)`;
    capsule.style.width = `${width}px`;
    capsule.style.opacity = "1";
  }, [active]);

  useEffect(() => {
    moveCapsule();
    window.addEventListener("resize", moveCapsule);
    return () => window.removeEventListener("resize", moveCapsule);
  }, [moveCapsule]);

  const setRef = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) itemRefs.current.set(key, el);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center rounded-full p-1 gap-0 select-none mx-auto"
      style={{
        background: "rgba(60,60,60,0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Sliding active capsule */}
      <div
        ref={capsuleRef}
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,255,255,0.1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          opacity: 0,
          transform: "translateX(0px)",
          width: "0px",
          transition: "transform 0.28s cubic-bezier(0.34,1.4,0.64,1), width 0.28s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s ease",
        }}
      />

      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            ref={setRef(item.key)}
            onClick={() => onChange(item.key)}
            className="relative z-10 flex items-center gap-2 px-4 h-9 rounded-full text-base font-medium transition-all cursor-pointer hover:brightness-150"
            style={{
              color: isActive ? "#FFFFFF" : "#888888",
            }}
          >
            <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
