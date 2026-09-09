export type MeProfile = {
  id: string;
  role: "admin" | "user";
  name: string;
  avatar_url: string | null;
};
