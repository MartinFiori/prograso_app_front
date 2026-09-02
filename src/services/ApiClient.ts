import { supabase } from "../utils/supabase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

if (!API_URL) {
  throw new Error("Falta REACT_APP_API_URL");
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponseType = "json" | "blob" | "text";

export type ApiRequestOptions = {
  method?: HttpMethod;
  resource: string;
  body?: unknown;
  opts?: {
    headers?: HeadersInit;
    signal?: AbortSignal;
    responseType?: ApiResponseType;
    requiresAuth?: boolean;
  };
};

export class HttpError extends Error {
  status: number;
  body: unknown;
  headers: Headers;

  constructor(
    message: string,
    status: number,
    body: unknown,
    headers: Headers,
  ) {
    super(message);

    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

function buildUrl(resource: string): string {
  if (/^https?:\/\//i.test(resource)) {
    return resource;
  }

  return `${API_URL.replace(/\/$/, "")}/${resource.replace(/^\//, "")}`;
}

async function parseResponse(
  response: Response,
  responseType: ApiResponseType,
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
    return JSON.parse(text);
  } catch {
    return text;
  }
}

class ApiClient {
  async request<TResponse = unknown>({
    method = "GET",
    resource,
    body,
    opts = {},
  }: ApiRequestOptions): Promise<TResponse> {
    const {
      headers: customHeaders = {},
      signal,
      responseType = "json",
      requiresAuth = true,
    } = opts;

    const headers = new Headers(customHeaders);

    if (requiresAuth) {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session?.access_token) {
        throw new HttpError("No hay una sesión activa", 401, null, headers);
      }

      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    let requestBody: BodyInit | undefined;

    if (body instanceof FormData) {
      requestBody = body;
    } else if (body instanceof Blob || typeof body === "string") {
      requestBody = body;
    } else if (body !== undefined && body !== null) {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(resource), {
      method,
      headers,
      signal,
      body: method === "GET" ? undefined : requestBody,
    });

    const responseData = await parseResponse(response, responseType);

    if (!response.ok) {
      const message =
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData &&
        typeof responseData.message === "string"
          ? responseData.message
          : `Error HTTP ${response.status}`;

      throw new HttpError(
        message,
        response.status,
        responseData,
        response.headers,
      );
    }

    return responseData as TResponse;
  }
}

export const api = new ApiClient();
