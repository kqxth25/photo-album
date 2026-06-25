"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useTilt } from "@/hooks/useTilt";
import { useInView, entryStyle } from "@/hooks/useInView";

interface Photo {
  id: string;
  filename: string;
  publicUrl: string;
  tags: string[];
  commentCount?: number;
  favoriteCount?: number;
}

interface PhotoCardProps {
  photo: Photo;
  index: number;
}

/**
 * Animated photo card: 3D tilt + glass highlight + staggered entry.
 * All transforms via GPU-composited properties for 60fps.
 */
export default function PhotoCard({ photo, index }: PhotoCardProps) {
  const { progress, ref: inViewRef } = useInView({
    threshold: 0.05,
    once: true,
    delay: index * 60,
  });

  const tilt = useTilt({ maxTilt: 6, perspective: 800 });

  // Combine refs
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (tilt.cardRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    },
    []
  );

  return (
    <div
      ref={mergedRef}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={entryStyle(progress)}
      className="break-inside-avoid"
    >
      <Link
        href={`/photo/${photo.id}`}
        className="block rounded-2xl overflow-hidden group relative"
        style={{
          background: "rgba(60,60,60,0.5)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)",
          transition: "none",
        }}
      >
        <img
          src={photo.publicUrl}
          alt={photo.filename}
          loading="lazy"
          className="w-full h-auto block"
        />

        {/* Glass highlight overlay */}
        <div
          data-glass-highlight
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 50%, transparent 70%)",
          }}
        />

        {/* Subtle inner border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            borderRadius: "inherit",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        />

        {/* Stats overlay on hover — top right */}
        <div
          className="absolute top-0 right-0 p-2.5 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ zIndex: 3 }}
        >
          <div className="flex items-center gap-2">
            {photo.commentCount !== undefined && (
              <span className="flex items-center gap-1 text-white text-[11px]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {photo.commentCount}
              </span>
            )}
            {photo.favoriteCount !== undefined && photo.favoriteCount > 0 && (
              <span className="flex items-center gap-1 text-white text-[11px]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} stroke="currentColor"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {photo.favoriteCount}
              </span>
            )}
          </div>
        </div>

        {/* Tags on hover */}
        {Array.isArray(photo.tags) && photo.tags.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ zIndex: 3 }}
          >
            <div className="flex flex-wrap gap-1">
              {photo.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] text-white"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  {tag}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span className="text-[10px] text-white/50">
                  +{photo.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}
