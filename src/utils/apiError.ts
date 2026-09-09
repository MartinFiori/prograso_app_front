import type { ConnectionError } from "../hooks/useConnection";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function formatConnectionError(result: ConnectionError): string {
  const description =
    typeof result.description === "string" && result.description.trim()
      ? result.description
      : result.message || "No se pudo completar la operación.";

  const errorCode =
    typeof result.errorCode === "string" ? result.errorCode : undefined;

  const issues = Array.isArray(result.data)
    ? result.data
        .flatMap((item) => {
          if (!isRecord(item) || typeof item.message !== "string") {
            return [];
          }

          const path = typeof item.path === "string" ? item.path : "";
          return [path ? `${path}: ${item.message}` : item.message];
        })
        .join("; ")
    : "";

  const withCode = errorCode ? `${description} (${errorCode})` : description;

  return issues ? `${withCode}. ${issues}` : withCode;
}
