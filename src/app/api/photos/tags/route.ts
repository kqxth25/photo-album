import { getAllTags } from "@/lib/db";

export async function GET() {
  const tags = await getAllTags();
  return Response.json(tags);
}
