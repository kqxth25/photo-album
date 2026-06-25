import { getSupabaseAdmin } from "./supabase";

export interface Photo {
  id: string;
  title: string | null;
  filename: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  description: string | null;
  tags: string[];
  created_at: string;
  commentCount?: number;
  favoriteCount?: number;
}

export interface PhotoFilters {
  search?: string;
  tag?: string;
}

export interface PaginatedResult {
  photos: Photo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_LIMIT = 20;

export async function getAllPhotos(
  filters?: PhotoFilters,
  page = 1,
  limit = DEFAULT_LIMIT
): Promise<PaginatedResult> {
  const supabase = getSupabaseAdmin();

  // ── Build base query ──
  let baseQuery = supabase.from("photos").select("*", { count: "exact" });

  if (filters?.search) {
    const term = `%${filters.search}%`;
    baseQuery = baseQuery.or(`filename.ilike.${term},description.ilike.${term}`);
  }
  if (filters?.tag) {
    baseQuery = baseQuery.contains("tags", [filters.tag]);
  }

  // ── Count ──
  const { count, error: countError } = await baseQuery;
  if (countError || count === null) {
    console.error("Count error:", countError);
    return { photos: [], total: 0, page, limit, totalPages: 0 };
  }

  // ── Paginate ──
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await baseQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Fetch error:", error);
    return { photos: [], total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  return {
    photos: (data || []) as Photo[],
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
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

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}
