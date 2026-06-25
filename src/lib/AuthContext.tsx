"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { getSupabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  username: string | null;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signUp: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      else setUsername(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsername = async (userId: string) => {
    const { data } = await getSupabase()
      .from("profiles").select("username").eq("id", userId).single();
    setUsername(data?.username ?? null);
  };

  const signIn = useCallback(async (uname: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "登录失败" };

      // Set the session client-side
      await getSupabase().auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return {};
    } catch {
      return { error: "登录服务暂不可用" };
    }
  }, []);

  const signUp = useCallback(async (uname: string, password: string) => {
    try {
      if (uname.length < 2) return { error: "用户名至少2个字符" };
      if (password.length < 6) return { error: "密码至少6位" };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "注册失败" };

      return {};
    } catch {
      return { error: "注册服务暂不可用" };
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setUser(null); setSession(null); setUsername(null);
  }, []);

  const requireAuth = useCallback(() => !!user, [user]);

  return (
    <AuthContext.Provider value={{ user, session, loading, username, signIn, signUp, signOut, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
