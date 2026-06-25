import { getSupabaseAdmin } from "./supabase";

export interface Photo {
  id: string;
  filename: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export async function getAllPhotos(): Promise<Photo[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch photos:", error);
    return [];
  }
  return data as Photo[];
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("photos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Photo;
}

export async function insertPhoto(photo: Photo): Promise<void> {
  const { error } = await getSupabaseAdmin().from("photos").insert(photo);
  if (error) {
    console.error("Failed to insert photo:", error);
    throw error;
  }
}

export async function deletePhoto(
  id: string
): Promise<{ photo: Photo | null; error: string | null }> {
  const photo = await getPhotoById(id);
  if (!photo) return { photo: null, error: "照片不存在" };

  const { error } = await getSupabaseAdmin()
    .from("photos")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Failed to delete photo:", error);
    return { photo: null, error: "删除失败" };
  }

  return { photo, error: null };
}
