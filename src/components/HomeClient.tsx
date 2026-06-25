"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import PhotoCard from "@/components/PhotoCard";
import SegmentedControl from "@/components/SegmentedControl";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "@/components/AuthModal";

/** Generate page numbers with ellipsis. e.g. [1, "...", 5, 6, 7, "...", 12] */
function generatePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

interface Photo {
  id: string;
  title: string | null;
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
  commentCount?: number;
  favoriteCount?: number;
}

interface Props {
  initialPhotos: Photo[];
  initialTotal: number;
  initialTotalPages: number;
  allTagsInitial: string[];
  initialTagFilter: string | null;
}

export default function HomeClient({
  initialPhotos,
  initialTotal,
  initialTotalPages,
  allTagsInitial,
  initialTagFilter,
}: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [allTags, setAllTags] = useState<string[]>(allTagsInitial);
  const [loading, setLoading] = useState(false); // not loading on first render!
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>(
    initialTagFilter ? [initialTagFilter] : []
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [jumpInput, setJumpInput] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [view, setView] = useState<"album" | "favorites">("album");
  const { user, username, signOut } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPhotos = useCallback(
    async (searchTerm?: string, filterTags?: string[], p?: number) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (filterTags && filterTags.length === 1) {
          params.set("tag", filterTags[0]);
        }
        params.set("page", String(p || page));
        params.set("limit", "12");
        const qs = params.toString();
        const res = await fetch(`/api/photos?${qs}`);
        const data = await res.json();
        setPhotos(data.photos);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        if (p) setPage(p);
      } catch (err) {
        console.error("Failed to load photos:", err);
      } finally {
        setLoading(false);
      }
    },
    [page]
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

  const loadFavorites = useCallback(async (p?: number) => {
    if (!user) { setAuthOpen(true); setView("album"); return; }
    try {
      setLoading(true);
      const pg = p || page;
      const res = await fetch(`/api/favorites?page=${pg}&limit=12`, {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (p) setPage(p);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  // Initial data is already set from props. Only need to re-fetch for
  // client-side navigation (tag from URL, view switch, etc.)
  useEffect(() => {
    if (initialTagFilter) return; // server already handled this
  }, []); // eslint-disable-line

  // Switch view
  const switchView = (key: string) => {
    setActiveTags([]);
    setSearch("");
    setView(key as "album" | "favorites");
    if (key === "favorites") {
      loadFavorites(1);
    }
  };

  // Unified page navigation
  const goToPage = (p: number) => {
    if (view === "favorites") loadFavorites(p);
    else fetchPhotos(search, activeTags, p);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchPhotos(value, activeTags, 1);
    }, 300);
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag];
      setPage(1);
      fetchPhotos(search, next, 1);
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
    setUploadTitle("");
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
    if (uploadTitle.trim()) {
      formData.append("title", uploadTitle.trim());
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
    <div className="flex flex-col min-h-screen">
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
            <SegmentedControl
              items={[
                {
                  key: "album",
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  label: "相册",
                },
                {
                  key: "favorites",
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ),
                  label: "收藏",
                },
              ]}
              active={view}
              onChange={switchView}
            />
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-base text-[#B8B8B8]">{username}</span>
                  <button
                    onClick={signOut}
                    className="h-11 px-5 text-white rounded-full hover:opacity-90 active:scale-95 transition-all text-base font-medium cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.1)", boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="h-11 px-5 bg-[#7EA9FF] text-white rounded-full hover:opacity-90 active:scale-95 transition-all text-base font-medium cursor-pointer"
                  style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
                >
                  注册 / 登录
                </button>
              )}
            </div>
          </div>

          {/* Search + Tags — only in album view */}
          {view === "album" && (
          <>
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
              className="w-full h-11 pl-11 pr-4 rounded-full text-base focus:outline-none transition-shadow placeholder-[#666666] text-[#ECECEC]"
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

          {allTags.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {allTags.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="shrink-0 h-8 px-3.5 rounded-full text-sm font-medium transition-all cursor-pointer hover:brightness-125 active:scale-95"
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
          </>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 flex flex-col">
        {/* Upload drop zone — only in album view */}
        {!showUploadForm && view === "album" && (
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
            <p className="text-[#B8B8B8] text-base">
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
            <h3 className="font-semibold text-[#ECECEC] mb-4 text-xl">
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

            {/* Title */}
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="标题（可选）..."
              className="w-full h-11 px-4 rounded-full text-base focus:outline-none mb-3 placeholder-[#666666] text-[#ECECEC]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            {/* Description */}
            <textarea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="添加描述（可选）..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-base focus:outline-none resize-none mb-3 placeholder-[#666666] text-[#ECECEC]"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                  style={{
                    background: "rgba(126,169,255,0.2)",
                    color: "#7EA9FF",
                  }}
                >
                  {tag}
                  <button
                    onClick={() => removeUploadTag(tag)}
                    className="hover:opacity-70 cursor-pointer text-base"
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
                className="flex-1 h-11 px-4 rounded-full text-base focus:outline-none placeholder-[#666666] text-[#ECECEC]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <button
                onClick={addUploadTag}
                className="h-11 px-4 rounded-full text-base text-[#B8B8B8] hover:text-white hover:brightness-125 active:scale-95 transition-all cursor-pointer"
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
                className="flex-1 h-11 bg-[#7EA9FF] text-white rounded-full hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all text-base font-medium cursor-pointer"
                style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
              >
                {uploading ? "上传中..." : "确认上传"}
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="h-11 px-5 rounded-full text-base text-[#B8B8B8] hover:text-white active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Empty state / Loading / Grid */}
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
              <rect
                x="65" y="14" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.04)"
                transform="rotate(-6 115 49)"
              />
              <rect
                x="58" y="10" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.07)"
                transform="rotate(3 108 45)"
              />
              <rect
                x="52" y="6" width="100" height="70" rx="4"
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              <path
                d="M78 76 L100 42 L115 56 L128 38 L142 76Z"
                fill="rgba(255,255,255,0.06)"
              />
              <circle cx="124" cy="48" r="8" fill="rgba(255,255,255,0.08)" />
              <circle cx="36" cy="34" r="2" fill="rgba(255,255,255,0.1)" />
              <circle cx="178" cy="22" r="2.5" fill="rgba(255,255,255,0.08)" />
              <circle cx="30" cy="110" r="2" fill="rgba(255,255,255,0.06)" />
              <circle cx="185" cy="108" r="1.5" fill="rgba(255,255,255,0.08)" />
              <circle cx="190" cy="62" r="2" fill="rgba(255,255,255,0.07)" />
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
            <p className="text-[#ECECEC] text-lg font-medium mb-1">
              {search || activeTags.length > 0
                ? "没有匹配的照片"
                : "拖拽或点击上传第一张照片"}
            </p>
            <p className="text-[#B8B8B8] text-base">
              支持 JPG、PNG、GIF、WebP 格式
            </p>
          </div>
        ) : (
          /* Photo grid */
          <div className="flex flex-wrap gap-4 animate-fadeInUp" key={`${view}-${search}-${activeTags.join(',')}-${page}`}>
            {photos.map((photo, i) => (
              <div key={photo.id} className="w-[calc(50%-0.5rem)] md:w-[calc(33.33%-0.67rem)]">
                <PhotoCard photo={photo} index={i} />
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Bottom pagination bar */}
      {!loading && (
        <div
          className="mt-auto flex items-center justify-center gap-2 px-4 py-3 flex-wrap rounded-3xl mx-auto max-w-lg"
          style={{
            background: "rgba(60,60,60,0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="h-8 w-8 flex items-center justify-center rounded-full text-base disabled:opacity-25 hover:bg-white/10 transition-colors"
            style={{ color: "#B8B8B8" }}
          >
            ‹
          </button>

          {generatePages(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dot-${i}`} className="w-8 text-center text-sm" style={{ color: "#666666" }}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p as number)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-sm transition-all"
                style={{
                  background: p === page ? "rgba(126,169,255,0.25)" : "transparent",
                  color: p === page ? "#7EA9FF" : "#B8B8B8",
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 flex items-center justify-center rounded-full text-base disabled:opacity-25 hover:bg-white/10 transition-colors"
            style={{ color: "#B8B8B8" }}
          >
            ›
          </button>

          <span className="text-sm ml-3" style={{ color: "#666666" }}>
            共 {total} 张
          </span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = parseInt(jumpInput, 10);
              if (n >= 1 && n <= totalPages) {
                fetchPhotos(search, activeTags, n);
              }
              setJumpInput("");
            }}
            className="flex items-center gap-1 ml-2"
          >
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={`${page}/${totalPages}`}
              className="h-8 w-14 px-2 rounded-full text-center text-sm focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#ECECEC",
              }}
            />
            <button
              type="submit"
              className="h-8 px-3 rounded-full text-sm hover:bg-white/10 transition-colors"
              style={{ color: "#B8B8B8" }}
            >
              跳转
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      {!showUploadForm && view === "album" && (
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
      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
