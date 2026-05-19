import Link from "next/link";
import { UserForm } from "@/components/admin/UserForm";
import { createUser } from "../actions";

export default function NewUserPage() {
  return (
    <main className="p-8 md:p-12">
      <Link href="/admin/users" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
        ← Usuários
      </Link>
      <h1 className="font-display text-4xl text-ink mt-3 mb-8">Novo usuário</h1>
      <UserForm mode="create" onSubmit={createUser} />
    </main>
  );
}
