import { getAppOrigin, getAuthRedirectTo } from "./appUrl";

describe("appUrl", () => {
  test("uses REACT_APP_SITE_URL without a trailing slash", () => {
    expect(
      getAuthRedirectTo({
        siteUrl: "https://app.example.com/",
        nodeEnv: "development",
      }),
    ).toBe("https://app.example.com/auth/callback");
  });

  test("falls back to the browser origin", () => {
    expect(
      getAuthRedirectTo({
        siteUrl: "",
        nodeEnv: "development",
        browserOrigin: "https://spa.example",
      }),
    ).toBe("https://spa.example/auth/callback");
  });

  test("production throws when the configured site URL is localhost", () => {
    expect(() =>
      getAuthRedirectTo({
        siteUrl: "http://localhost:3000",
        nodeEnv: "production",
        browserOrigin: "https://prod.example",
      }),
    ).toThrow(/localhost en production/);
  });

  test("production without site URL uses the browser origin", () => {
    expect(
      getAuthRedirectTo({
        siteUrl: "",
        nodeEnv: "production",
        browserOrigin: "https://prograso-app.vercel.app",
      }),
    ).toBe("https://prograso-app.vercel.app/auth/callback");
  });

  test("local development may use localhost", () => {
    expect(
      getAuthRedirectTo({
        siteUrl: "",
        nodeEnv: "development",
        browserOrigin: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000/auth/callback");
  });

  test("getAppOrigin strips a trailing slash", () => {
    expect(
      getAppOrigin({
        siteUrl: "https://app.example.com/",
        nodeEnv: "development",
      }),
    ).toBe("https://app.example.com");
  });
});
