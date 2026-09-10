import type { ProfileCategory, ProfileGender } from "../constants/profileFields";

export type MeProfile = {
  id: string;
  role: "admin" | "user";
  name: string;
  avatar_url: string | null;
  category: ProfileCategory | null;
  gender: ProfileGender | null;
  phone_number: string | null;
};
