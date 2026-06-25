"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      setPhotos(data);
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    try {
      const res = await fetch("/api/photos", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      await fetchPhotos();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      uploadFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchPhotos]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">📷 共享相册</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer"
          >
            {uploading ? "上传中..." : "上传照片"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-8 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-zinc-300 hover:border-zinc-400 bg-white"
          }`}
        >
          <p className="text-zinc-500 text-sm">
            {uploading
              ? "正在上传..."
              : "拖拽照片到这里，或点击选择文件"}
          </p>
          {uploading && (
            <div className="mt-3 h-1 w-48 mx-auto bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse rounded-full" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Photo grid */}
        {loading ? (
          <div className="text-center text-zinc-400 py-20">加载中...</div>
        ) : photos.length === 0 ? (
          <div className="text-center text-zinc-400 py-20">
            <p className="text-4xl mb-3">📸</p>
            <p>还没有照片，上传第一张吧</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/photo/${photo.id}`}
                className="block break-inside-avoid rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group relative"
              >
                <img
                  src={photo.publicUrl}
                  alt={photo.filename}
                  loading="lazy"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
