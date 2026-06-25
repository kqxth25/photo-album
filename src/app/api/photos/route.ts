import { NextRequest } from "next/server";
import { getAllPhotos, insertPhoto, type Photo } from "@/lib/db";
import { processUpload } from "@/lib/upload";
import { getSupabaseAdmin } from "@/lib/supabase";

function withPublicUrl(photo: Photo) {
  const { data } = getSupabaseAdmin()
    .storage
    .from("photo")
    .getPublicUrl(photo.stored_name);
  return { ...photo, publicUrl: data.publicUrl };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const search = sp.get("search") || undefined;
  const tag = sp.get("tag") || undefined;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "20", 10)));

  const result = await getAllPhotos({ search, tag }, page, limit);
  const photoIds = result.photos.map((p) => p.id);

  // Fetch comment + favorite counts in batch
  const [commentCounts, favoriteCounts] = await Promise.all([
    photoIds.length > 0
      ? getSupabaseAdmin()
          .from("comments")
          .select("photo_id")
          .in("photo_id", photoIds)
          .then(({ data }) => {
            const map: Record<string, number> = {};
            (data || []).forEach((r) => {
              map[r.photo_id] = (map[r.photo_id] || 0) + 1;
            });
            return map;
          })
      : Promise.resolve({} as Record<string, number>),
    photoIds.length > 0
      ? getSupabaseAdmin()
          .from("favorites")
          .select("photo_id")
          .in("photo_id", photoIds)
          .then(({ data }) => {
            const map: Record<string, number> = {};
            (data || []).forEach((r) => {
              map[r.photo_id] = (map[r.photo_id] || 0) + 1;
            });
            return map;
          })
      : Promise.resolve({} as Record<string, number>),
  ]);

  const photosWithUrl = result.photos.map((p) =>
    withPublicUrl({
      ...p,
      commentCount: commentCounts[p.id] || 0,
      favoriteCount: favoriteCounts[p.id] || 0,
    })
  );

  return Response.json({
    photos: photosWithUrl,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return Response.json({ error: "没有选择文件" }, { status: 400 });
    }

    // Parse description and tags from form data
    const title = (formData.get("title") as string) || null;
    const description = (formData.get("description") as string) || null;
    const tagsRaw = (formData.get("tags") as string) || "";
    const tags = tagsRaw
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const results = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (file.size === 0) continue;

      const uploaded = await processUpload(file);
      await insertPhoto({
        id: uploaded.id,
        title,
        filename: uploaded.filename,
        stored_name: uploaded.storedName,
        mime_type: uploaded.mimeType,
        size_bytes: uploaded.sizeBytes,
        width: uploaded.width,
        height: uploaded.height,
        description,
        tags,
        created_at: new Date().toISOString(),
      });

      results.push({
        id: uploaded.id,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        width: uploaded.width,
        height: uploaded.height,
        description,
        tags,
        publicUrl: uploaded.publicUrl,
      });
    }

    return Response.json({ uploaded: results }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "上传失败" }, { status: 500 });
  }
}
