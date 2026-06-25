"use client";

import { useState, useEffect, useCallback } from "react";
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
      <div className="flex-1 flex items-center justify-center bg-black text-white">
        <p className="text-zinc-400">加载中...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-zinc-400">照片不存在</p>
        <Link href="/" className="text-blue-400 hover:underline">
          返回相册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-black/60 absolute top-0 left-0 right-0 z-10">
        <Link
          href="/"
          className="text-sm text-zinc-300 hover:text-white transition-colors"
        >
          ← 返回相册
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            {currentIndex + 1} / {allPhotos.length}
          </span>
          <button
            onClick={handleDownload}
            className="text-sm px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            下载
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm px-3 py-1.5 rounded-md bg-red-800 hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {deleting ? "删除中..." : "删除"}
          </button>
        </div>
      </div>

      {/* Photo area */}
      <div className="flex-1 flex items-center justify-center px-4 pt-14 pb-4">
        <img
          src={photo.publicUrl}
          alt={photo.filename}
          className="max-h-full max-w-full object-contain rounded-sm"
        />
      </div>

      {/* Navigation arrows */}
      {prevPhoto && (
        <Link
          href={`/photo/${prevPhoto.id}`}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors text-xl"
        >
          ‹
        </Link>
      )}
      {nextPhoto && (
        <Link
          href={`/photo/${nextPhoto.id}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors text-xl"
        >
          ›
        </Link>
      )}

      {/* Photo info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center bg-black/60 text-zinc-400 text-xs">
        {photo.filename}{" "}
        {photo.width && photo.height && (
          <span>
            · {photo.width}×{photo.height}
          </span>
        )}{" "}
        · {formatSize(photo.size_bytes)}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
