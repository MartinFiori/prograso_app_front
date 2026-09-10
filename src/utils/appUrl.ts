type AppUrlEnv = {
  siteUrl?: string;
  nodeEnv?: string;
  browserOrigin?: string;
};

const LOCALHOST_SITE_URL_ERROR =
  "REACT_APP_SITE_URL no puede ser localhost en production";

function isLocalhostOrigin(value: string): boolean {
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

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAppOrigin(env: AppUrlEnv = {}): string {
  const siteUrl = stripTrailingSlash(
    (env.siteUrl ?? process.env.REACT_APP_SITE_URL ?? "").trim(),
  );
  const nodeEnv = env.nodeEnv ?? process.env.NODE_ENV;
  const browserOrigin = stripTrailingSlash(
    env.browserOrigin ??
      (typeof window === "undefined" ? "" : window.location.origin),
  );

  if (nodeEnv === "production" && isLocalhostOrigin(siteUrl)) {
    throw new Error(LOCALHOST_SITE_URL_ERROR);
  }

  return siteUrl || browserOrigin;
}

export function getAuthRedirectTo(env?: AppUrlEnv): string {
  return `${getAppOrigin(env)}/auth/callback`;
}
