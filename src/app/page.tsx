"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import PhotoCard from "@/components/PhotoCard";

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

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPhotos = useCallback(
    async (searchTerm?: string, filterTags?: string[]) => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (filterTags && filterTags.length === 1) {
          params.set("tag", filterTags[0]);
        }
        const qs = params.toString();
        const res = await fetch(`/api/photos${qs ? `?${qs}` : ""}`);
        const data = await res.json();
        setPhotos(data);
      } catch (err) {
        console.error("Failed to load photos:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/photos/tags");
      const data = await res.json();
      setAllTags(data);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialTag = urlParams.get("tag");
    if (initialTag) {
      setActiveTags([initialTag]);
      fetchPhotos(undefined, [initialTag]);
    } else {
      fetchPhotos();
    }
    fetchTags();
  }, [fetchPhotos, fetchTags]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPhotos(value, activeTags);
    }, 300);
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag];
      fetchPhotos(search, next);
      return next;
    });
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    if (files.length === 0) return;
    const fileArr = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size > 0
    );
    if (fileArr.length === 0) return;
    setSelectedFiles(fileArr);
    setUploadDesc("");
    setUploadTags([]);
    setTagInput("");
    setShowUploadForm(true);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  }, []);

  const addUploadTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !uploadTags.includes(trimmed)) {
      setUploadTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const removeUploadTag = (tag: string) => {
    setUploadTags((prev) => prev.filter((t) => t !== tag));
  };

  const submitUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("files", file);
    }
    if (uploadDesc.trim()) {
      formData.append("description", uploadDesc.trim());
    }
    if (uploadTags.length > 0) {
      formData.append("tags", uploadTags.join(","));
    }
    try {
      const res = await fetch("/api/photos", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      setShowUploadForm(false);
      setSelectedFiles([]);
      await fetchPhotos(search, activeTags);
      await fetchTags();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setShowUploadForm(false);
    setSelectedFiles([]);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header — glass morphism */}
      <header
        className="sticky top-0 z-10 border-b border-white/8"
        style={{
          background: "rgba(30,30,30,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[24px] font-bold text-white tracking-tight">
              📷 共享相册
            </h1>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-11 px-5 bg-[#7EA9FF] text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity text-sm font-medium cursor-pointer"
              style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
            >
              {uploading ? "上传中..." : "上传照片"}
            </button>
          </div>

          {/* Search bar — capsule */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#666666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索照片名称或描述..."
              className="w-full h-11 pl-11 pr-4 rounded-full text-sm focus:outline-none transition-shadow placeholder-[#666666] text-[#ECECEC]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 2px #7EA9FF";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Tag filter bar */}
          {allTags.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {allTags.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{
                      background: active
                        ? "#7EA9FF"
                        : "rgba(255,255,255,0.08)",
                      color: active ? "#FFFFFF" : "#B8B8B8",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">
        {/* Upload drop zone */}
        {!showUploadForm && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className="mb-8 border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragOver
                ? "#7EA9FF"
                : "rgba(255,255,255,0.12)",
              background: dragOver
                ? "rgba(126,169,255,0.08)"
                : "rgba(60,60,60,0.3)",
            }}
          >
            <p className="text-[#B8B8B8] text-sm">
              拖拽照片到这里，或点击选择文件
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            e.target.files && handleFilesSelected(e.target.files)
          }
          className="hidden"
        />

        {/* Upload form — glass card */}
        {showUploadForm && (
          <div
            className="mb-8 rounded-3xl p-6"
            style={{
              background: "rgba(60,60,60,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <h3 className="font-semibold text-[#ECECEC] mb-4 text-lg">
              已选择 {selectedFiles.length} 张照片
            </h3>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Description */}
            <textarea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="添加描述（可选）..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none mb-3 placeholder-[#666666] text-[#ECECEC]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(126,169,255,0.2)",
                    color: "#7EA9FF",
                  }}
                >
                  {tag}
                  <button
                    onClick={() => removeUploadTag(tag)}
                    className="hover:opacity-70 cursor-pointer text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUploadTag();
                  }
                }}
                placeholder="添加标签，回车确认..."
                className="flex-1 h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666] text-[#ECECEC]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <button
                onClick={addUploadTag}
                className="h-11 px-4 rounded-full text-sm text-[#B8B8B8] hover:text-white transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                添加
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={submitUpload}
                disabled={uploading}
                className="flex-1 h-11 bg-[#7EA9FF] text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity text-sm font-medium cursor-pointer"
                style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
              >
                {uploading ? "上传中..." : "确认上传"}
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="h-11 px-5 rounded-full text-sm text-[#B8B8B8] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#B8B8B8]">加载中...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto mb-8 w-56 h-40"
              viewBox="0 0 220 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back photo */}
              <rect
                x="65" y="14" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.04)"
                transform="rotate(-6 115 49)"
              />
              {/* Middle photo */}
              <rect
                x="58" y="10" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.07)"
                transform="rotate(3 108 45)"
              />
              {/* Front photo */}
              <rect
                x="52" y="6" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              {/* Mountain */}
              <path
                d="M78 76 L100 42 L115 56 L128 38 L142 76Z"
                fill="rgba(255,255,255,0.06)"
              />
              {/* Sun */}
              <circle cx="124" cy="48" r="8" fill="rgba(255,255,255,0.08)" />
              {/* Decorative dots */}
              <circle cx="36" cy="34" r="2" fill="rgba(255,255,255,0.1)" />
              <circle cx="178" cy="22" r="2.5" fill="rgba(255,255,255,0.08)" />
              <circle cx="30" cy="110" r="2" fill="rgba(255,255,255,0.06)" />
              <circle cx="185" cy="108" r="1.5" fill="rgba(255,255,255,0.08)" />
              <circle cx="190" cy="62" r="2" fill="rgba(255,255,255,0.07)" />
              {/* Arrow */}
              <path
                d="M104 92 L104 118"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M96 110 L104 120 L112 110"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[#ECECEC] text-base font-medium mb-1">
              {search || activeTags.length > 0
                ? "没有匹配的照片"
                : "拖拽或点击上传第一张照片"}
            </p>
            <p className="text-[#B8B8B8] text-sm">
              支持 JPG、PNG、GIF、WebP 格式
            </p>
          </div>
        ) : (
          /* Photo grid */
          <div className="columns-2 sm:columns-3 md:columns-4 gap-5 space-y-5">
            {photos.map((photo, i) => (
              <PhotoCard key={photo.id} photo={photo} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      {!showUploadForm && (
        <button
          onClick={() => {
            fileInputRef.current?.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer z-20 transition-all hover:scale-105"
          style={{
            background: "#7EA9FF",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)",
          }}
          title="上传照片"
        >
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
