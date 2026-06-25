import { v4 as uuidv4 } from "uuid";
import path from "path";
import { getSupabaseAdmin } from "./supabase";
import sharp from "sharp";

const BUCKET_NAME = "photo";

export interface UploadedFile {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  publicUrl: string;
}

export async function processUpload(file: File): Promise<UploadedFile> {
  const ext = path.extname(file.name) || ".jpg";
  const id = uuidv4();
  const storedName = `${id}${ext}`;
  let buffer: any = Buffer.from(await file.arrayBuffer());

  // Detect image dimensions
  let width: number | null = null;
  let height: number | null = null;
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      width = metadata.width;
      height = metadata.height;
    }

    // Compress: resize to max 2048px on longest edge, convert to JPEG 85%
    const maxDim = 2048;
    const longEdge = Math.max(width || 0, height || 0);
    const isPng = file.type === "image/png";
    const isGif = file.type === "image/gif";

    if (!isGif && longEdge > maxDim) {
      const pipeline = sharp(buffer)
        .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true });
      buffer = (await pipeline.toBuffer()) as unknown as Buffer;

      // Update dimensions after resize
      const newMeta = await sharp(buffer).metadata();
      width = newMeta.width || width;
      height = newMeta.height || height;
    } else if (!isGif && !isPng && buffer.length > 500 * 1024) {
      // JPEG/WebP over 500KB: recompress
      const pipeline = sharp(buffer).jpeg({ quality: 85, mozjpeg: true });
      buffer = (await pipeline.toBuffer()) as unknown as Buffer;
    }
  } catch {
    // Not a supported image format — upload as-is
  }

  const supabase = getSupabaseAdmin();

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storedName, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error("文件上传失败");
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storedName);

  return {
    id,
    filename: file.name,
    storedName,
    mimeType: file.type || "image/jpeg",
    sizeBytes: buffer.length,
    width,
    height,
    publicUrl: urlData.publicUrl,
  };
}

export async function deleteFile(storedName: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .storage
    .from(BUCKET_NAME)
    .remove([storedName]);

  if (error) {
    console.error("Storage delete error:", error);
  }
}
