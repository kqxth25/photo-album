import { getSupabaseAdmin } from "./supabase";

export interface Photo {
  id: string;
  filename: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  description: string | null;
  tags: string[];
  created_at: string;
}

interface PhotoFilters {
  search?: string;
  tag?: string;
}

export async function getAllPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  let query = getSupabaseAdmin()
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `filename.ilike.${term},description.ilike.${term}`
    );
  }

  if (filters?.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch photos:", error);
    return [];
  }
  return (data || []) as Photo[];
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

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("photos")
    .select("tags");

  if (error || !data) return [];

  const tagCounts = new Map<string, number>();
  for (const row of data) {
    if (row.tags && Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        const trimmed = tag.trim();
        if (trimmed) {
          tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1);
        }
      }
    }
  }

  // Sort by frequency descending
  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}
