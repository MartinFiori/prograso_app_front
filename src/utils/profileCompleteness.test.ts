import { isProfileComplete } from "./profileCompleteness";

describe("isProfileComplete", () => {
  test("rejects a missing profile", () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  test("rejects an empty name", () => {
    expect(
      isProfileComplete({
        id: "1",
        role: "user",
        name: "  ",
        avatar_url: null,
        category: null,
        gender: null,
        phone_number: null,
      }),
    ).toBe(false);
  });

  test("accepts a named profile", () => {
    expect(
      isProfileComplete({
        id: "1",
        role: "user",
        name: "Ana",
        avatar_url: null,
        category: null,
        gender: null,
        phone_number: null,
      }),
    ).toBe(true);
  });
});
