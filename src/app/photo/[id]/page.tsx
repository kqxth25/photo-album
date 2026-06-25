import Link from "next/link";
import { getPhotoById, getNeighborIds } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import PhotoViewer from "@/components/PhotoViewer";

export default async function PhotoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhotoById(id);

  if (!photo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-[#B8B8B8]">照片不存在</p>
        <Link href="/" className="text-[#7EA9FF] hover:underline text-base">返回相册</Link>
      </div>
    );
  }

  const [{ data: urlData }, { prevId, nextId }] = await Promise.all([
    getSupabaseAdmin().storage.from("photo").getPublicUrl(photo.stored_name),
    getNeighborIds(photo),
  ]);

  return (
    <PhotoViewer
      photo={{
        ...photo,
        publicUrl: urlData.publicUrl,
        prevId,
        nextId,
      }}
    />
  );
}
