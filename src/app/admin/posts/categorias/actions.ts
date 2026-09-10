"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { assertSection } from "@/lib/admin-guard";

export async function createCategory(name: string) {
  await assertSection("posts");
  const sb = await createClient();
  const slug = slugify(name, { lower: true, strict: true });
  const { error } = await sb.from("post_categories").insert({ name: name.trim(), slug });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts/categorias");
}

export async function deleteCategory(id: string) {
  await assertSection("posts");
  const sb = await createClient();
  const { error } = await sb.from("post_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts/categorias");
}
