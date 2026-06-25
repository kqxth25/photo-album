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
  const search = request.nextUrl.searchParams.get("search") || undefined;
  const tag = request.nextUrl.searchParams.get("tag") || undefined;
  const photos = await getAllPhotos({ search, tag });
  return Response.json(photos.map(withPublicUrl));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return Response.json({ error: "没有选择文件" }, { status: 400 });
    }

    // Parse description and tags from form data
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
