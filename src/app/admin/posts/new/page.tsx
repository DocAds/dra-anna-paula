import Link from "next/link";
import { PostEditor } from "@/components/admin/PostEditor";
import { createPost } from "../actions";

export default function NewPostPage() {
  return (
    <main className="p-8 md:p-12">
      <div className="mb-8">
        <Link href="/admin/posts" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
          ← Posts
        </Link>
        <h1 className="font-display text-4xl text-ink mt-3">Novo post</h1>
      </div>
      <PostEditor onSubmit={createPost} />
    </main>
  );
}
