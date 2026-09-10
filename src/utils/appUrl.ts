type AppUrlEnv = {
  siteUrl?: string;
  nodeEnv?: string;
};

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
  const browserOrigin =
    typeof window === "undefined"
      ? ""
      : stripTrailingSlash(window.location.origin);

  if (nodeEnv === "production" && isLocalhostOrigin(siteUrl)) {
    return browserOrigin;
  }

  return siteUrl || browserOrigin;
}

export function getAuthRedirectTo(env?: AppUrlEnv): string {
  return `${getAppOrigin(env)}/auth/callback`;
}
