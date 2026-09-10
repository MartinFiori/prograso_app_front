export function authLog(
  message: string,
  details?: Record<string, unknown>,
): void {
  if (details) {
    console.info("[auth]", message, details);
    return;
  }

  console.info("[auth]", message);
}
