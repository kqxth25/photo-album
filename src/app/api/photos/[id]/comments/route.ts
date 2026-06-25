import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET — list comments
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data, error } = await getSupabaseAdmin()
    .from("comments")
    .select("*")
    .eq("photo_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Comments fetch error:", error);
    return Response.json([]);
  }

  return Response.json(data || []);
}

// POST — add comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: { content?: string; username?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "无效的请求" }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) return Response.json({ error: "评论内容不能为空" }, { status: 400 });
  if (content.length > 500) return Response.json({ error: "评论不能超过500字" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("comments")
    .insert({ photo_id: id, content, username: body.username || null })
    .select()
    .single();

  if (error) {
    console.error("Comment insert error:", error);
    return Response.json({ error: "评论失败" }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
