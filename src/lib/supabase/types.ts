export type UserRole = "admin" | "editor";
export type PostStatus = "draft" | "published" | "archived";

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
