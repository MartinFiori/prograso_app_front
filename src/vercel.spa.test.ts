import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

describe("production SPA config", () => {
  test("vercel.json rewrites all paths to the CRA index", () => {
    const vercel = JSON.parse(
      readFileSync(join(__dirname, "../vercel.json"), "utf8"),
    ) as { rewrites: Array<{ source: string; destination: string }> };

    expect(vercel.rewrites).toEqual([
      { source: "/(.*)", destination: "/index.html" },
    ]);
  });

  test("prebuild fails when REACT_APP_SITE_URL is localhost", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/assert-prod-site-url.js"],
      {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
        env: {
          ...process.env,
          REACT_APP_SITE_URL: "http://localhost:3000",
        },
      },
    );

    expect(result.status).toBe(1);
  });

  test("prebuild passes without a localhost site URL", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/assert-prod-site-url.js"],
      {
        cwd: join(__dirname, ".."),
        encoding: "utf8",
        env: {
          ...process.env,
          REACT_APP_SITE_URL: "https://prograso-app.vercel.app",
        },
      },
    );

    expect(result.status).toBe(0);
  });
});
