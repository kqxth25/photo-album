import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET — check if current user favorited this photo
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return Response.json({ favorited: false });

  const { data } = await getSupabaseAdmin()
    .from("favorites")
    .select("id")
    .eq("photo_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return Response.json({ favorited: !!data });
}

// POST — toggle favorite
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = request.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("photo_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Unfavorite
    await supabase.from("favorites").delete().eq("id", existing.id);
    return Response.json({ favorited: false });
  } else {
    // Favorite
    await supabase.from("favorites").insert({ photo_id: id, user_id: userId });
    return Response.json({ favorited: true });
  }
}
