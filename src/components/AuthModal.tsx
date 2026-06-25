"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setUsername(""); setPassword(""); setPassword2(""); setError("");
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m); reset();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!username.trim() || !password) { setError("请填写完整"); return; }
    setLoading(true);
    const { error: err } = await signIn(username.trim(), password);
    if (err) setError(err); else { reset(); onClose(); }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!username.trim() || !password || !password2) { setError("请填写完整"); return; }
    if (password !== password2) { setError("两次密码不一致"); return; }
    if (password.length < 6) { setError("密码至少6位"); return; }
    setLoading(true);
    const { error: err } = await signUp(username.trim(), password);
    if (err) setError(err);
    else { setError(""); setMode("login"); reset(); }
    setLoading(false);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ECECEC",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "rgba(45,45,45,0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {mode === "login" ? (
          <>
            <h2 className="text-lg font-semibold text-white mb-5">登录</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名" autoComplete="username"
                className="h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666]"
                style={inputStyle}
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="密码" autoComplete="current-password"
                className="h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666]"
                style={inputStyle}
              />
              {error && <p className="text-xs text-[#FF6A6A]">{error}</p>}
              <button type="submit" disabled={loading}
                className="h-11 rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: "#7EA9FF", color: "#fff" }}>
                {loading ? "..." : "登录"}
              </button>
            </form>
            <p className="text-xs text-[#666666] text-center mt-4">
              还没有账号？
              <button onClick={() => switchMode("register")}
                className="text-[#7EA9FF] hover:underline ml-1">注册</button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white mb-5">注册</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名" autoComplete="username"
                className="h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666]"
                style={inputStyle}
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（至少6位）" autoComplete="new-password"
                className="h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666]"
                style={inputStyle}
              />
              <input
                type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
                placeholder="确认密码" autoComplete="new-password"
                className="h-11 px-4 rounded-full text-sm focus:outline-none placeholder-[#666666]"
                style={inputStyle}
              />
              {error && <p className="text-xs text-[#FF6A6A]">{error}</p>}
              <button type="submit" disabled={loading}
                className="h-11 rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ background: "#7EA9FF", color: "#fff" }}>
                {loading ? "..." : "注册"}
              </button>
            </form>
            <p className="text-xs text-[#666666] text-center mt-4">
              已有账号？
              <button onClick={() => switchMode("login")}
                className="text-[#7EA9FF] hover:underline ml-1">去登录</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
