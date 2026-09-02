import { useCallback } from "react";

import { supabase } from "../utils/supabase";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ConnectionResponseType = "json" | "blob" | "text";

export type ConnectionOptions<
  TResponseType extends ConnectionResponseType = "json",
> = {
  method?: HttpMethod;
  url: string;
  extraHeaders?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal | null;
  abortRepeat?: boolean;

  /** @deprecated Usar abortRepeat. Se conserva por compatibilidad. */
  abortRepect?: boolean;

  responseType?: TResponseType;
  requiresAuth?: boolean;
};

export type BlobResponse = {
  data: Blob;
  status: number;
  ok: true;
};

export type ConnectionError = {
  error: true;
  message: string;
  codeError: number;
  status: number;
  networkError?: boolean;
  originalError?: unknown;
  headers?: Headers;
  [key: string]: unknown;
};

type ConnectionSuccess<
  TResponse,
  TResponseType extends ConnectionResponseType,
> = TResponseType extends "blob" ? BlobResponse : TResponse;

export type ConnectionResult<
  TResponse,
  TResponseType extends ConnectionResponseType,
> = ConnectionSuccess<TResponse, TResponseType> | ConnectionError;

const pendingRequests = new Map<string, AbortController>();

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

if (!API_URL) {
  throw new Error("Falta REACT_APP_API_URL");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequestUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

async function parseResponse(
  response: Response,
  responseType: ConnectionResponseType,
): Promise<unknown> {
  if (responseType === "blob") {
    return response.blob();
  }

  if (responseType === "text") {
    return response.text();
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getBackendMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) {
    return fallback;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.description === "string") {
    return data.description;
  }

  return fallback;
}

function getBackendCode(data: unknown, fallback: number): number {
  if (!isRecord(data)) {
    return fallback;
  }

  if (typeof data.codeError === "number") {
    return data.codeError;
  }

  if (typeof data.statusCode === "number") {
    return data.statusCode;
  }

  return fallback;
}

export function isConnectionError(result: unknown): result is ConnectionError {
  return isRecord(result) && result.error === true;
}

export function useConnection() {
  const connection = useCallback(
    async <
      TResponse = unknown,
      TResponseType extends ConnectionResponseType = "json",
    >({
      method = "GET",
      url,
      extraHeaders = {},
      body,
      signal = null,
      abortRepeat,
      abortRepect,
      responseType = "json" as TResponseType,
      requiresAuth = true,
    }: ConnectionOptions<TResponseType>): Promise<
      ConnectionResult<TResponse, TResponseType>
    > => {
      const requestKey = `${method}:${url}`;
      const shouldAbortPrevious = abortRepeat ?? abortRepect ?? false;

      if (shouldAbortPrevious) {
        pendingRequests.get(requestKey)?.abort();
      }

      const controller = new AbortController();
      const handleExternalAbort = () => controller.abort();

      if (signal?.aborted) {
        controller.abort();
      } else {
        signal?.addEventListener("abort", handleExternalAbort, { once: true });
      }

      if (shouldAbortPrevious) {
        pendingRequests.set(requestKey, controller);
      }

      try {
        const headers = new Headers(extraHeaders);

        if (requiresAuth) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (!session?.access_token) {
            return {
              error: true,
              message: "No hay una sesión activa",
              codeError: 401,
              status: 401,
            };
          }

          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${session.access_token}`);
          }
        }

        let requestBody: BodyInit | undefined;

        if (body instanceof FormData) {
          headers.delete("Content-Type");
          requestBody = body;
        } else if (
          body instanceof Blob ||
          body instanceof URLSearchParams ||
          typeof body === "string"
        ) {
          requestBody = body;
        } else if (body !== undefined && body !== null) {
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
          }

          requestBody = JSON.stringify(body);
        }

        const response = await fetch(getRequestUrl(url), {
          method,
          headers,
          signal: controller.signal,
          body: method === "GET" ? undefined : requestBody,
        });

        const responseData = await parseResponse(response, responseType);

        if (!response.ok) {
          const bodyError = isRecord(responseData) ? responseData : {};

          return {
            ...bodyError,
            error: true,
            message: getBackendMessage(
              responseData,
              `Error HTTP ${response.status}`,
            ),
            codeError: getBackendCode(responseData, response.status),
            status: response.status,
            originalError: responseData,
            headers: response.headers,
          };
        }

        if (responseType === "blob") {
          return {
            data: responseData as Blob,
            status: response.status,
            ok: true,
          } as ConnectionResult<TResponse, TResponseType>;
        }

        return responseData as ConnectionResult<TResponse, TResponseType>;
      } catch (error: unknown) {
        const wasAborted =
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError");

        if (wasAborted) {
          return {
            error: true,
            message: "Petición cancelada",
            codeError: 103,
            status: 0,
            originalError: error,
          };
        }

        return {
          error: true,
          message: error instanceof Error ? error.message : "Error inesperado",
          codeError: 500,
          status: 0,
          networkError: true,
          originalError: error,
        };
      } finally {
        signal?.removeEventListener("abort", handleExternalAbort);

        if (
          shouldAbortPrevious &&
          pendingRequests.get(requestKey) === controller
        ) {
          pendingRequests.delete(requestKey);
        }
      }
    },
    [],
  );

  return connection;
}
