const { readFileSync } = require("fs");
const { join } = require("path");

function readSiteUrlFromFile(fileName) {
  try {
    const text = readFileSync(join(__dirname, "..", fileName), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const match = trimmed.match(/^REACT_APP_SITE_URL=(.*)$/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    return "";
  }

  return "";
}

const siteUrl = (
  process.env.REACT_APP_SITE_URL ||
  readSiteUrlFromFile(".env.production") ||
  ""
).trim();

function isLocalhostOrigin(value) {
  if (!value) {
    return false;
  }

  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

if (isLocalhostOrigin(siteUrl)) {
  console.error(
    "REACT_APP_SITE_URL no puede ser localhost en un build de production.",
  );
  process.exit(1);
}
