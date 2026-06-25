import { getSupabaseAdmin } from "@/lib/supabase";

// DELETE /api/comments/[commentId]
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await context.params;

  const { error } = await getSupabaseAdmin()
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return Response.json({ error: "删除失败" }, { status: 500 });
  }

  return Response.json({ success: true });
}
