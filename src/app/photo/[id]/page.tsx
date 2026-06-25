"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "@/components/AuthModal";

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
}

interface Comment {
  id: string;
  photo_id: string;
  content: string;
  username?: string;
  created_at: string;
}

export default function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const { user, username: currentUsername } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const photoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const fetchPhoto = useCallback(async () => {
    try {
      const [photoRes, listRes] = await Promise.all([
        fetch(`/api/photos/${id}`),
        fetch("/api/photos"),
      ]);
      if (!photoRes.ok) { setPhoto(null); return; }
      setPhoto(await photoRes.json());
      const listData = await listRes.json();
      setAllPhotos(listData.photos || listData);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/photos/${id}/comments`);
      const data = await res.json();
      if (Array.isArray(data)) { setComments(data); setCommentCount(data.length); }
    } catch { /* ignore */ }
  }, [id]);

  const checkFavorite = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/photos/${id}/favorite`, {
        headers: { "x-user-id": user.id },
      });
      setFavorited((await res.json()).favorited || false);
    } catch { /* ignore */ }
  }, [id, user]);

  useEffect(() => { fetchPhoto(); fetchComments(); if (user) checkFavorite(); },
    [fetchPhoto, fetchComments, checkFavorite]);

  const currentIndex = allPhotos.findIndex((p) => p.id === id);
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;

  const handleDelete = async () => {
    if (!confirm("确定删除？")) return;
    setDeleting(true);
    try { await fetch(`/api/photos/${id}`, { method: "DELETE" }); router.push("/"); router.refresh(); }
    catch { alert("删除失败"); setDeleting(false); }
  };

  const handleDownload = () => {
    if (!photo) return;
    const a = document.createElement("a"); a.href = photo.publicUrl;
    a.download = photo.filename; a.click();
  };

  const submitComment = async () => {
    if (!user) { setAuthOpen(true); return; }
    const text = commentInput.trim(); if (!text) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/photos/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, username: currentUsername || "用户" }),
      });
      if (res.ok) { setCommentInput(""); await fetchComments(); }
    } catch { /* ignore */ }
    finally { setCommenting(false); }
  };

  const deleteComment = async (commentId: string) => {
    try { await fetch(`/api/comments/${commentId}`, { method: "DELETE" }); await fetchComments(); }
    catch { /* ignore */ }
  };

  const toggleFavorite = async () => {
    if (!user) { setAuthOpen(true); return; }
    setFavLoading(true);
    try {
      const res = await fetch(`/api/photos/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
      });
      setFavorited((await res.json()).favorited);
    } catch { /* ignore */ }
    finally { setFavLoading(false); }
  };

  const goToTag = (tag: string) => router.push(`/?tag=${tag}`);

  const commentsRef = useRef<HTMLDivElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showComments && commentsListRef.current) {
      commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
    }
  }, [comments, showComments]);

  useEffect(() => {
    if (!showComments) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (commentsRef.current && !commentsRef.current.contains(target)) {
        const btn = document.querySelector("[data-comment-toggle]");
        if (btn && btn.contains(target)) return;
        setShowComments(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showComments]);

  // Mouse parallax
  useEffect(() => {
    const el = photoRef.current; if (!el) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      const w2 = window.innerWidth / 2, h2 = window.innerHeight / 2;
      tx = ((e.clientX - w2) / w2) * 8; ty = ((e.clientY - h2) / h2) * 8;
    };
    const animate = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      const img = el.querySelector("img") as HTMLImageElement | null;
      if (img) { img.style.transform = `translate(${cx}px, ${cy}px)`; img.style.maxWidth = "100%"; img.style.maxHeight = "100%"; img.style.objectFit = "contain"; }
      rafRef.current = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, [photo?.id]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevPhoto) router.push(`/photo/${prevPhoto.id}`);
      else if (e.key === "ArrowRight" && nextPhoto) router.push(`/photo/${nextPhoto.id}`);
      else if (e.key === "Escape") { if (showComments) setShowComments(false); else router.push("/"); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevPhoto, nextPhoto, router, showComments]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-[#B8B8B8]">加载中...</p></div>;
  if (!photo) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <p className="text-[#B8B8B8]">照片不存在</p>
      <Link href="/" className="text-[#7EA9FF] hover:underline text-base">返回相册</Link>
    </div>
  );

  const glassBar = {
    background: "rgba(30,30,30,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  } as const;

  const glassBarBottom = {
    background: "rgba(30,30,30,0.5)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
  } as const;

  return (
    <div className="flex flex-col h-screen-dynamic overflow-hidden safe-top safe-bottom">
      {/* ═══ Top bar ═══ */}
      <div className="shrink-0 z-10" style={glassBar}>
        <div className="flex items-center px-4 py-1.5 gap-2">
          <Link href="/"
            className="h-8 px-3 rounded-full text-sm flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", color: "#B8B8B8" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#B8B8B8"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </Link>
          <div className="flex-1 flex flex-col items-center min-w-0">
            <p className="text-sm text-[#ECECEC] font-medium truncate max-w-[200px]">
              {photo.title || photo.description || photo.filename}
            </p>
            {Array.isArray(photo.tags) && photo.tags.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {photo.tags.slice(0, 3).map((tag) => (
                  <span key={tag} onClick={() => goToTag(tag)}
                    className="px-1.5 py-0.5 rounded-full text-[11px] cursor-pointer hover:brightness-150 active:scale-95 transition-all"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#B8B8B8" }}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-[#666666]">{currentIndex + 1}/{allPhotos.length}</span>
            <button onClick={handleDownload}
              className="text-sm h-8 px-3 rounded-full text-[#ECECEC] hover:text-white hover:brightness-125 active:scale-95 transition-all cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)" }}>下载</button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-sm h-8 px-3 rounded-full text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-transform cursor-pointer"
              style={{ background: "#FF6A6A" }}>{deleting ? "删" : "删除"}</button>
          </div>
        </div>
      </div>

      {/* ═══ Photo area — flex-1 fills remaining space ═══ */}
      <div ref={photoRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <img
          src={photo.publicUrl}
          alt={photo.filename}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            transition: "none",
          }}
        />
      </div>

      {/* ═══ Nav arrows ═══ */}
      {prevPhoto && (
        <Link href={`/photo/${prevPhoto.id}`}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white text-xl hover:scale-110 hover:bg-white/20 active:scale-95 transition-all z-10"
          style={{ background: "rgba(255,255,255,0.1)" }}>‹</Link>
      )}
      {nextPhoto && (
        <Link href={`/photo/${nextPhoto.id}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white text-xl hover:scale-110 hover:bg-white/20 active:scale-95 transition-all z-10"
          style={{ background: "rgba(255,255,255,0.1)" }}>›</Link>
      )}

      {/* ═══ Comments floating panel ═══ */}
      <div ref={commentsRef}
        className="absolute bottom-14 right-4 w-72 max-h-[50vh] flex flex-col rounded-2xl overflow-hidden z-20"
        style={{
          background: "rgba(35,35,35,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          opacity: showComments ? 1 : 0, transform: showComments ? "scale(1)" : "scale(0.85)",
          pointerEvents: showComments ? "auto" : "none", transformOrigin: "bottom right",
          transition: "opacity 0.25s cubic-bezier(0.34,1.56,0.64,1), transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
        <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <h3 className="text-base font-medium text-[#ECECEC]">评论 {commentCount > 0 && `(${commentCount})`}</h3>
          {comments.length === 0 ? (
            <p className="text-sm text-[#666666] py-4 text-center">暂无评论</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="group">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-[#7EA9FF] font-medium">{c.username || "用户"}</span>
                  <span className="text-[11px] text-[#666666]">
                    {new Date(c.created_at).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-[#ECECEC] leading-relaxed">{c.content}</p>
                <button onClick={() => deleteComment(c.id)}
                  className="text-[11px] text-[#666666] hover:text-[#FF6A6A] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">删除</button>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-white/5 flex gap-2">
          <input type="text" value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
            placeholder="添加评论..." maxLength={500}
            className="flex-1 h-9 px-3 rounded-full text-sm focus:outline-none placeholder-[#666666] text-[#ECECEC]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <button onClick={submitComment} disabled={commenting || !commentInput.trim()}
            className="h-9 px-4 rounded-full text-sm disabled:opacity-40 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
            style={{ background: "#7EA9FF", color: "#fff" }}>{commenting ? "..." : "发送"}</button>
        </div>
      </div>

      {/* ═══ Bottom bar ═══ */}
      <div className="shrink-0 z-10 relative" style={glassBarBottom}>
        <div className="flex items-center justify-center gap-2 px-4 py-1.5">
          {photo.description && (
            <button onClick={() => setShowDesc(!showDesc)}
              className="h-8 px-3 rounded-full text-sm transition-all active:scale-95 flex items-center gap-1.5 hover:brightness-125"
              style={{ background: showDesc ? "rgba(126,169,255,0.2)" : "rgba(255,255,255,0.06)", color: showDesc ? "#7EA9FF" : "#B8B8B8" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h10" /></svg>
              {showDesc ? "收起" : "描述"}
            </button>
          )}
          <button data-comment-toggle
            onClick={() => { if (!user) { setAuthOpen(true); return; } setShowComments(prev => { if (!prev) fetchComments(); return !prev; }); }}
            className="h-8 px-3 rounded-full text-sm transition-all active:scale-95 flex items-center gap-1.5 hover:brightness-125"
            style={{ background: showComments ? "rgba(126,169,255,0.2)" : "rgba(255,255,255,0.06)", color: showComments ? "#7EA9FF" : "#B8B8B8" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            评论{commentCount > 0 && ` ${commentCount}`}
          </button>
          <button onClick={toggleFavorite} disabled={favLoading}
            className="h-8 px-3 rounded-full text-sm transition-all active:scale-95 flex items-center gap-1.5 hover:brightness-125"
            style={{ background: favorited ? "rgba(255,106,106,0.2)" : "rgba(255,255,255,0.06)", color: favorited ? "#FF6A6A" : "#B8B8B8" }}>
            <svg className="w-3.5 h-3.5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            收藏
          </button>
        </div>
        {showDesc && photo.description && (
          <div className="absolute bottom-full left-0 right-0 px-4 py-1.5 text-center"
            style={{ background: "rgba(30,30,30,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-[#ECECEC] leading-relaxed max-w-lg mx-auto line-clamp-2">{photo.description}</p>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
