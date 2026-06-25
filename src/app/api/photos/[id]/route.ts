import { getPhotoById, deletePhoto } from "@/lib/db";
import { deleteFile } from "@/lib/upload";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const photo = await getPhotoById(id);

  if (!photo) {
    return Response.json({ error: "照片不存在" }, { status: 404 });
  }

  const { data } = getSupabaseAdmin()
    .storage
    .from("photo")
    .getPublicUrl(photo.stored_name);

  return Response.json({ ...photo, publicUrl: data.publicUrl });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { photo, error } = await deletePhoto(id);

  if (error || !photo) {
    return Response.json({ error: error || "照片不存在" }, { status: 404 });
  }

  await deleteFile(photo.stored_name);
  return Response.json({ success: true });
}
