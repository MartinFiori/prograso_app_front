import { profileDisplayName } from "./profileDisplay";
import type { MeProfile } from "../types/me";

describe("profileDisplayName", () => {
  const profile: MeProfile = {
    id: "1",
    role: "user",
    name: "Ana",
    avatar_url: null,
    category: null,
    gender: null,
    phone_number: null,
  };

  test("prefers the profile name", () => {
    expect(
      profileDisplayName(profile, {
        user_metadata: { full_name: "Otro" },
      } as never),
    ).toBe("Ana");
  });

  test("falls back to Usuario", () => {
    expect(profileDisplayName(null, null)).toBe("Usuario");
  });
});
