import { getAllPhotos, getAllTags } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import HomeClient from "@/components/HomeClient";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const sp = await searchParams;
  const initialTag = sp.tag || undefined;

  // Fetch initial photos + tags in parallel
  const [result, tags] = await Promise.all([
    getAllPhotos(
      initialTag ? { tag: initialTag } : undefined,
      1,
      12
    ),
    getAllTags(),
  ]);

  const supabase = getSupabaseAdmin();
  const photoIds = result.photos.map((p) => p.id);

  // Batch: public URLs + comment/favorite counts
  const photosWithUrls = result.photos.map((p) => {
    const { data } = supabase.storage.from("photo").getPublicUrl(p.stored_name);
    return { ...p, publicUrl: data.publicUrl };
  });

  const [commentCounts, favoriteCounts] = await Promise.all([
    photoIds.length > 0
      ? supabase
          .from("comments")
          .select("photo_id")
          .in("photo_id", photoIds)
          .then(({ data }) => {
            const map: Record<string, number> = {};
            (data || []).forEach((r: { photo_id: string }) => {
              map[r.photo_id] = (map[r.photo_id] || 0) + 1;
            });
            return map;
          })
      : Promise.resolve({} as Record<string, number>),
    photoIds.length > 0
      ? supabase
          .from("favorites")
          .select("photo_id")
          .in("photo_id", photoIds)
          .then(({ data }) => {
            const map: Record<string, number> = {};
            (data || []).forEach((r: { photo_id: string }) => {
              map[r.photo_id] = (map[r.photo_id] || 0) + 1;
            });
            return map;
          })
      : Promise.resolve({} as Record<string, number>),
  ]);

  const photos = photosWithUrls.map((p) => ({
    ...p,
    commentCount: commentCounts[p.id] || 0,
    favoriteCount: favoriteCounts[p.id] || 0,
  }));

  return (
    <HomeClient
      initialPhotos={photos}
      initialTotal={result.total}
      initialTotalPages={result.totalPages}
      allTagsInitial={tags}
      initialTagFilter={initialTag || null}
    />
  );
}
