export type UserRole = "admin" | "editor";
export type PostStatus = "draft" | "published" | "archived";
export type LeadTemperatura = "frio" | "morno" | "quente";
export type LeadFase =
  | "novo"
  | "contatado"
  | "agendado"
  | "compareceu"
  | "convertido"
  | "perdido";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  status: PostStatus;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostWithAuthor = Post & {
  author: Pick<Profile, "id" | "name" | "email" | "avatar_url"> | null;
};

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  whatsapp: string;
  whatsapp_country: string | null;
  email: string | null;
  cidade: string | null;
  interesse: string | null;
  urgencia: string | null;
  mensagem: string | null;
  source: string | null;
  page_url: string | null;
  user_agent: string | null;
  ip_country: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  temperatura: LeadTemperatura;
  fase: LeadFase;
  assigned_to: string | null;
  notas: string | null;
};
