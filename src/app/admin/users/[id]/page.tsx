import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserForm } from "@/components/admin/UserForm";
import { updateUser, deleteUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) return notFound();

  const update = async (fd: FormData) => {
    "use server";
    await updateUser(id, fd);
  };
  const remove = async () => {
    "use server";
    await deleteUser(id);
  };

  return (
    <main className="p-8 md:p-12">
      <Link href="/admin/users" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
        ← Usuários
      </Link>
      <h1 className="font-display text-4xl text-ink mt-3 mb-8">Editar usuário</h1>
      <UserForm mode="edit" initial={profile} onSubmit={update} onDelete={remove} />
    </main>
  );
}
