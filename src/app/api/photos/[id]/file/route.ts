import { getPhotoById } from "@/lib/db";
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

  return Response.redirect(data.publicUrl);
}
