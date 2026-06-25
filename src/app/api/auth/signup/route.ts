import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "无效的请求" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;

  if (!username || username.length < 2) {
    return Response.json({ error: "用户名至少2个字符" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return Response.json({ error: "密码至少6位" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const email = `${username.toLowerCase()}@photo-album.app`;

  // Check if username already taken (via profiles)
  const { data: existing } = await supabase
    .from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) {
    return Response.json({ error: "该用户名已被使用" }, { status: 409 });
  }

  // Create auth user via Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (authError || !authData.user) {
    console.error("Create user error:", authError);
    return Response.json({ error: "注册失败，请重试" }, { status: 500 });
  }

  // Create profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({ id: authData.user.id, username });

  if (profileErr) {
    return Response.json({ error: "创建资料失败" }, { status: 500 });
  }

  return Response.json({ success: true });
}
