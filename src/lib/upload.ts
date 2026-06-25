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
  const buffer = Buffer.from(await file.arrayBuffer());

  // Detect image dimensions
  let width: number | null = null;
  let height: number | null = null;
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      width = metadata.width;
      height = metadata.height;
    }
  } catch {
    // Not a supported image format
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
