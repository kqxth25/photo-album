import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "无效的请求" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return Response.json({ error: "请填写用户名和密码" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const email = `${username.toLowerCase()}@photo-album.app`;

  // Try to sign in. We need to return the session token so the client can set it.
  // Use the REST API directly since admin SDK doesn't have signInWithPassword.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message === "Invalid login credentials"
      ? "用户名或密码错误" : error.message;
    return Response.json({ error: msg }, { status: 401 });
  }

  return Response.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id },
  });
}
