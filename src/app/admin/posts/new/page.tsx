import Link from "next/link";
import { PostEditor } from "@/components/admin/PostEditor";
import { createPost } from "../actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const sb = await createClient();
  const [{ data: categories }, { data: aiConfig }] = await Promise.all([
    sb.from("post_categories").select("name").order("name"),
    sb.from("ai_settings").select("provider, api_token, instructions, model").eq("id", 1).maybeSingle(),
  ]);
  return (
    <main className="p-8 md:p-12">
      <div className="mb-8">
        <Link href="/admin/posts" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
          ← Posts
        </Link>
        <h1 className="font-display text-4xl text-ink mt-3">Novo post</h1>
      </div>
      <PostEditor onSubmit={createPost} categories={categories || []} aiConfig={aiConfig} />
    </main>
  );
}
