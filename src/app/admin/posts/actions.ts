"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import type { PostStatus } from "@/lib/supabase/types";

function uniqueSlug(base: string) {
  const slug = slugify(base, { lower: true, strict: true });
  return slug || `post-${Date.now()}`;
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const title = String(formData.get("title") || "Sem título").trim();
  const baseSlug = String(formData.get("slug") || title);
  let slug = uniqueSlug(baseSlug);

  // garante unicidade
  const { data: exists } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      slug,
      excerpt: String(formData.get("excerpt") || ""),
      content: String(formData.get("content") || ""),
      category: String(formData.get("category") || "") || null,
      cover_image: String(formData.get("cover_image") || "") || null,
      status: (formData.get("status") as PostStatus) || "draft",
      author_id: user.id,
      published_at: formData.get("status") === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect(`/admin/posts/${data!.id}?ok=created`);
}

export async function updatePost(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const status = (formData.get("status") as PostStatus) || "draft";
  const baseSlug = String(formData.get("slug") || "");
  const title = String(formData.get("title") || "Sem título").trim();

  // se publicando agora, set published_at
  const { data: current } = await supabase
    .from("posts")
    .select("published_at, status")
    .eq("id", id)
    .single();

  const published_at =
    status === "published" && !current?.published_at
      ? new Date().toISOString()
      : current?.published_at ?? null;

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      slug: uniqueSlug(baseSlug || title),
      excerpt: String(formData.get("excerpt") || ""),
      content: String(formData.get("content") || ""),
      category: String(formData.get("category") || "") || null,
      cover_image: String(formData.get("cover_image") || "") || null,
      status,
      published_at,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  revalidatePath("/blog");
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  redirect("/admin/posts");
}
