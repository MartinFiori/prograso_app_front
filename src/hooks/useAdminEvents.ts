import { useCallback, useEffect, useState } from "react";

import type { ApiPagination, ApiResponse } from "../types";
import type {
  AdminEvent,
  CreateEventBody,
  UpdateEventBody,
} from "../types/admin";
import type { EventCategory, EventStatus, ListEventsQuery } from "../types/events";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import {
  createEventPath,
  deleteEventPath,
  getAdminEventByIdPath,
  listAdminEventsPath,
  listCategoriesPath,
  listStatusesPath,
  parseEventIdParam,
  updateEventPath,
} from "../services/eventsApi";
import { formatConnectionError } from "../utils/apiError";

export { parseEventIdParam };

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      events: AdminEvent[];
      pagination: ApiPagination | null;
    }
  | { status: "error"; message: string };

type DetailState =
  | { status: "loading" }
  | { status: "success"; event: AdminEvent }
  | { status: "not-found" }
  | { status: "invalid-id" }
  | { status: "error"; message: string };

export function useAdminEventList(query: ListEventsQuery = {}) {
  const connection = useConnection();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const page = query.page ?? 1;
  const statusCode = query.status_code;
  const categoryId = query.category_id;

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const result = await connection<ApiResponse<AdminEvent[]>>({
      url: listAdminEventsPath({
        page,
        status_code: statusCode,
        category_id: categoryId,
      }),
    });

    if (isConnectionError(result)) {
      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({
      status: "success",
      events: result.data ?? [],
      pagination: result.pagination ?? null,
    });
  }, [categoryId, connection, page, statusCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(
    async (id: number): Promise<string | null> => {
      const result = await connection({
        method: "DELETE",
        url: deleteEventPath(id),
      });

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [connection, load],
  );

  return { state, reload: load, remove };
}

export function useAdminEventDetail(rawId: string | undefined) {
  const connection = useConnection();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const id = parseEventIdParam(rawId);

  const load = useCallback(async () => {
    if (id === null) {
      setState({ status: "invalid-id" });
      return;
    }

    setState({ status: "loading" });

    const result = await connection<ApiResponse<AdminEvent>>({
      url: getAdminEventByIdPath(id),
    });

    if (isConnectionError(result)) {
      if (result.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({ status: "success", event: result.data });
  }, [connection, id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, id, reload: load };
}

export function useAdminEventMutations() {
  const connection = useConnection();

  const create = useCallback(
    async (body: CreateEventBody) => {
      const result = await connection<ApiResponse<AdminEvent>>({
        method: "POST",
        url: createEventPath(),
        body,
      });

      if (isConnectionError(result)) {
        return { error: formatConnectionError(result) };
      }

      return { event: result.data };
    },
    [connection],
  );

  const update = useCallback(
    async (eventId: number, body: UpdateEventBody) => {
      const result = await connection<ApiResponse<AdminEvent>>({
        method: "PATCH",
        url: updateEventPath(eventId),
        body,
      });

      if (isConnectionError(result)) {
        return { error: formatConnectionError(result) };
      }

      return { event: result.data };
    },
    [connection],
  );

  return { create, update };
}

export function useEventFormLookups() {
  const connection = useConnection();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [statuses, setStatuses] = useState<EventStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [categoriesResult, statusesResult] = await Promise.all([
        connection<ApiResponse<EventCategory[]>>({
          url: listCategoriesPath(),
          requiresAuth: false,
        }),
        connection<ApiResponse<EventStatus[]>>({
          url: listStatusesPath(),
          requiresAuth: false,
        }),
      ]);

      if (cancelled) {
        return;
      }

      if (isConnectionError(categoriesResult)) {
        setError(formatConnectionError(categoriesResult));
        return;
      }

      if (isConnectionError(statusesResult)) {
        setError(formatConnectionError(statusesResult));
        return;
      }

      setCategories(categoriesResult.data ?? []);
      setStatuses(statusesResult.data ?? []);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { categories, statuses, error };
}
