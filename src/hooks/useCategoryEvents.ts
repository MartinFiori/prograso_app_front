import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  isConnectionError,
  useConnection,
  type ConnectionError,
} from "./useConnection";
import {
  EVENTS_PAGE_LIMIT,
  getCategoryByIdPath,
  listEventsPath,
  listStatusesPath,
  parseEventIdParam,
} from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type { EventCategory, EventStatus, PublicEvent } from "../types/events";

export type CategoryEventsState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "not-found" }
  | { status: "empty"; category: EventCategory }
  | {
      status: "success";
      category: EventCategory;
      events: PublicEvent[];
      page: number;
      totalPages: number;
    }
  | { status: "error"; message: string; errorCode?: string };

function readErrorCode(error: ConnectionError): string | undefined {
  return typeof error.errorCode === "string" ? error.errorCode : undefined;
}

export function useCategoryEvents() {
  const { category_id: categoryIdParam } = useParams<{ category_id: string }>();
  const categoryId = parseEventIdParam(categoryIdParam);
  const connection = useConnection();
  const [state, setState] = useState<CategoryEventsState>({ status: "loading" });
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = useState<EventStatus[]>([]);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (categoryId === null) {
      setState({ status: "invalid-id" });
      return;
    }

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setState({ status: "loading" });

    const [categoryResult, eventsResult, statusesResult] = await Promise.all([
      connection<ApiResponse<EventCategory>>({
        url: getCategoryByIdPath(categoryId),
        requiresAuth: false,
        abortRepeat: true,
      }),
      connection<ApiResponse<PublicEvent[]>>({
        url: listEventsPath({
          category_id: categoryId,
          page,
          limit: EVENTS_PAGE_LIMIT,
        }),
        requiresAuth: false,
        abortRepeat: true,
      }),
      connection<ApiResponse<EventStatus[]>>({
        url: listStatusesPath(),
        requiresAuth: false,
      }),
    ]);

    if (currentRequest !== requestId.current) {
      return;
    }

    if (!isConnectionError(statusesResult)) {
      setStatuses(statusesResult.data ?? []);
    }

    if (isConnectionError(categoryResult)) {
      if (categoryResult.message === "Petición cancelada") {
        return;
      }

      if (
        categoryResult.status === 404 ||
        readErrorCode(categoryResult) === "ENTITY_NOT_FOUND"
      ) {
        setState({ status: "not-found" });
        return;
      }

      setState({
        status: "error",
        message: categoryResult.message,
        errorCode: readErrorCode(categoryResult),
      });
      return;
    }

    if (isConnectionError(eventsResult)) {
      if (eventsResult.message === "Petición cancelada") {
        return;
      }

      setState({
        status: "error",
        message: eventsResult.message,
        errorCode: readErrorCode(eventsResult),
      });
      return;
    }

    const category = categoryResult.data;
    const events = (eventsResult.data ?? []).filter(
      (event) => event.category_id === categoryId,
    );
    const nextPage = eventsResult.pagination?.page ?? page;
    const totalPages = eventsResult.pagination?.total_pages ?? 1;

    if (events.length === 0) {
      setState({ status: "empty", category });
      return;
    }

    setState({
      status: "success",
      category,
      events,
      page: nextPage,
      totalPages,
    });
  }, [categoryId, connection, page]);

  useEffect(() => {
    setPage(1);
  }, [categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, statuses, setPage, reload: load };
}
