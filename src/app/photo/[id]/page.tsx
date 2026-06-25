"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Photo {
  id: string;
  filename: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  description: string | null;
  tags: string[];
  created_at: string;
  publicUrl: string;
}

export default function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Mouse-follow parallax on the photo
  const photoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const fetchPhoto = useCallback(async () => {
    try {
      const [photoRes, listRes] = await Promise.all([
        fetch(`/api/photos/${id}`),
        fetch("/api/photos"),
      ]);
      if (!photoRes.ok) {
        setPhoto(null);
        return;
      }
      const photoData = await photoRes.json();
      const listData = await listRes.json();
      setPhoto(photoData);
      setAllPhotos(listData);
    } catch (err) {
      console.error("Failed to load photo:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  const currentIndex = allPhotos.findIndex((p) => p.id === id);
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto =
    currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;

  const handleDelete = async () => {
    if (!confirm("确定删除这张照片吗？")) return;
    setDeleting(true);
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("删除失败");
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo.publicUrl;
    a.download = photo.filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const goToTag = (tag: string) => {
    router.push(`/?tag=${tag}`);
  };

  // Mouse-follow parallax: subtle image shift
  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * 8; // ±8px
      targetY = ((e.clientY - cy) / cy) * 8;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      const img = el.querySelector("img");
      if (img) {
        img.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.02)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [photo?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevPhoto) {
        router.push(`/photo/${prevPhoto.id}`);
      } else if (e.key === "ArrowRight" && nextPhoto) {
        router.push(`/photo/${nextPhoto.id}`);
      } else if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevPhoto, nextPhoto, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B8B8B8]">加载中...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-[#B8B8B8]">照片不存在</p>
        <Link href="/" className="text-[#7EA9FF] hover:underline text-sm">
          返回相册
        </Link>
      </div>
    );
  }

  const glassBar = {
    background: "rgba(30,30,30,0.5)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  } as const;

  const glassBarBottom = {
    background: "rgba(30,30,30,0.5)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
  } as const;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10" style={glassBar}>
        <div className="flex items-center justify-between px-5 py-3.5">
          <Link
            href="/"
            className="text-sm text-[#B8B8B8] hover:text-white transition-colors"
          >
            ← 返回相册
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#666666]">
              {currentIndex + 1} / {allPhotos.length}
            </span>
            <button
              onClick={handleDownload}
              className="text-sm h-9 px-4 rounded-full text-[#ECECEC] hover:text-white active:scale-95 transition-transform cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              下载
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm h-9 px-4 rounded-full text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-transform cursor-pointer"
              style={{ background: "#FF6A6A" }}
            >
              {deleting ? "删除中..." : "删除"}
            </button>
          </div>
        </div>
      </div>

      {/* Photo area with mouse parallax */}
      <div
        ref={photoRef}
        className="flex-1 flex items-center justify-center px-4 pt-14 pb-20"
      >
        <img
          src={photo.publicUrl}
          alt={photo.filename}
          className="max-h-full max-w-full object-contain rounded-sm will-change-transform"
          style={{ transition: "none" }}
        />
      </div>

      {/* Nav arrows */}
      {prevPhoto && (
        <Link
          href={`/photo/${prevPhoto.id}`}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white text-xl hover:scale-110 active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          ‹
        </Link>
      )}
      {nextPhoto && (
        <Link
          href={`/photo/${nextPhoto.id}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white text-xl hover:scale-110 active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          ›
        </Link>
      )}

      {/* Bottom info bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-5 py-4"
        style={glassBarBottom}
      >
        <div className="max-w-3xl mx-auto">
          {photo.description ? (
            <p className="text-[15px] font-semibold text-white mb-1">
              {photo.description}
              {photo.width && photo.height && (
                <span className="text-[#B8B8B8] text-xs ml-2 font-normal">
                  {photo.width}×{photo.height} · {formatSize(photo.size_bytes)}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[15px] font-semibold text-white mb-1">
              {photo.filename}
              {photo.width && photo.height && (
                <span className="text-[#B8B8B8] text-xs ml-2 font-normal">
                  {photo.width}×{photo.height} · {formatSize(photo.size_bytes)}
                </span>
              )}
            </p>
          )}

          {Array.isArray(photo.tags) && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => goToTag(tag)}
                  className="px-2.5 py-0.5 rounded-full text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#B8B8B8",
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
