import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return Response.json({ photos: [] });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "20", 10)));

  const supabase = getSupabaseAdmin();

  // Get favorited photo IDs
  const { data: favs, error: favErr } = await supabase
    .from("favorites")
    .select("photo_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favErr || !favs) return Response.json({ photos: [], total: 0 });

  const photoIds = favs.map((f) => f.photo_id);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const pagedIds = photoIds.slice(from, to + 1);

  if (pagedIds.length === 0) {
    return Response.json({ photos: [], total: photoIds.length, page, limit, totalPages: Math.ceil(photoIds.length / limit) });
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .in("id", pagedIds);

  // Sort in favorites order
  const photoMap = new Map((photos || []).map((p) => [p.id, p]));
  const sorted = pagedIds.map((id) => photoMap.get(id)).filter(Boolean);

  // Add public URLs
  const resultPhotos = sorted.map((p) => {
    const { data: urlData } = supabase.storage.from("photo").getPublicUrl(p.stored_name);
    return { ...p, publicUrl: urlData.publicUrl };
  });

  return Response.json({
    photos: resultPhotos,
    total: photoIds.length,
    page,
    limit,
    totalPages: Math.ceil(photoIds.length / limit),
  });
}
