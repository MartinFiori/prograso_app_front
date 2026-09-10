import { getAppOrigin, getAuthRedirectTo } from "./appUrl";

describe("appUrl", () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  test("uses REACT_APP_SITE_URL without a trailing slash", () => {
    expect(
      getAuthRedirectTo({
        siteUrl: "https://app.example.com/",
        nodeEnv: "development",
      }),
    ).toBe("https://app.example.com/auth/callback");
  });

  test("falls back to window.location.origin", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://spa.example" },
    });

    expect(
      getAuthRedirectTo({
        siteUrl: "",
        nodeEnv: "development",
      }),
    ).toBe("https://spa.example/auth/callback");
  });

  test("production ignores a localhost site URL", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://prod.example" },
    });

    expect(
      getAuthRedirectTo({
        siteUrl: "http://localhost:3000",
        nodeEnv: "production",
      }),
    ).toBe("https://prod.example/auth/callback");
  });

  test("production without site URL uses the browser origin", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://prod.example" },
    });

    expect(
      getAppOrigin({
        siteUrl: "",
        nodeEnv: "production",
      }),
    ).toBe("https://prod.example");
  });
});
