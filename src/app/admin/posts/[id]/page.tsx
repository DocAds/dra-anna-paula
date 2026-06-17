import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/admin/PostEditor";
import { updatePost, deletePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("post_categories").select("name").order("name"),
  ]);
  if (!post) return notFound();

  const update = async (fd: FormData) => {
    "use server";
    await updatePost(id, fd);
  };
  const remove = async () => {
    "use server";
    await deletePost(id);
  };

  return (
    <main className="p-8 md:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin/posts" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
            ← Posts
          </Link>
          <h1 className="font-display text-4xl text-ink mt-3">Editar post</h1>
        </div>
        {post.status === "published" && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-[11px] uppercase tracking-widest2 text-cocoa underline-editorial"
          >
            Ver no site →
          </Link>
        )}
      </div>
      <PostEditor initial={post} postId={post.id} onSubmit={update} onDelete={remove} categories={categories || []} />
    </main>
  );
}
