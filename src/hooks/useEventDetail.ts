import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  isConnectionError,
  useConnection,
  type ConnectionError,
} from "./useConnection";
import {
  EVENTS_PAGE_LIMIT,
  getEventByIdPath,
  listRegistrationsByEventPath,
  listStatusesPath,
  parseEventIdParam,
} from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type {
  EventRegistrationWithProfile,
  EventStatus,
  PublicEvent,
} from "../types/events";

export type RegistrationsViewState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "success";
      registrations: EventRegistrationWithProfile[];
      page: number;
      totalPages: number;
    }
  | { status: "error"; message: string; errorCode?: string };

export type EventDetailViewState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "not-found" }
  | {
      status: "success";
      event: PublicEvent;
      statuses: EventStatus[];
    }
  | { status: "error"; message: string; errorCode?: string };

function readErrorCode(error: ConnectionError): string | undefined {
  return typeof error.errorCode === "string" ? error.errorCode : undefined;
}

export function useEventDetail() {
  const { category_id: categoryIdParam, event_id: eventIdParam } = useParams<{
    category_id: string;
    event_id: string;
  }>();
  const categoryId = parseEventIdParam(categoryIdParam);
  const eventId = parseEventIdParam(eventIdParam);
  const connection = useConnection();
  const [state, setState] = useState<EventDetailViewState>({
    status: "loading",
  });
  const [registrationsState, setRegistrationsState] =
    useState<RegistrationsViewState>({ status: "loading" });
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const registrationsRequestId = useRef(0);

  const loadEvent = useCallback(async () => {
    if (categoryId === null || eventId === null) {
      setState({ status: "invalid-id" });
      setRegistrationsState({ status: "empty" });
      return;
    }

    setState({ status: "loading" });

    const [eventResult, statusesResult] = await Promise.all([
      connection<ApiResponse<PublicEvent>>({
        url: getEventByIdPath(eventId),
        requiresAuth: false,
        abortRepeat: true,
      }),
      connection<ApiResponse<EventStatus[]>>({
        url: listStatusesPath(),
        requiresAuth: false,
      }),
    ]);

    const statuses = isConnectionError(statusesResult)
      ? []
      : (statusesResult.data ?? []);

    if (isConnectionError(eventResult)) {
      if (eventResult.message === "Petición cancelada") {
        return;
      }

      if (
        eventResult.status === 404 ||
        readErrorCode(eventResult) === "event_not_found"
      ) {
        setState({ status: "not-found" });
        return;
      }

      setState({
        status: "error",
        message: eventResult.message,
        errorCode: readErrorCode(eventResult),
      });
      return;
    }

    if (eventResult.data.category_id !== categoryId) {
      setState({ status: "not-found" });
      return;
    }

    setState({
      status: "success",
      event: eventResult.data,
      statuses,
    });
  }, [categoryId, connection, eventId]);

  const loadRegistrations = useCallback(
    async (resolvedEventId: number, page: number) => {
      const currentRequest = registrationsRequestId.current + 1;
      registrationsRequestId.current = currentRequest;
      setRegistrationsState({ status: "loading" });

      const result = await connection<
        ApiResponse<EventRegistrationWithProfile[]>
      >({
        url: listRegistrationsByEventPath(resolvedEventId, {
          page,
          limit: EVENTS_PAGE_LIMIT,
        }),
        requiresAuth: false,
        abortRepeat: true,
      });

      if (currentRequest !== registrationsRequestId.current) {
        return;
      }

      if (isConnectionError(result)) {
        if (result.message === "Petición cancelada") {
          return;
        }

        setRegistrationsState({
          status: "error",
          message: result.message,
          errorCode: readErrorCode(result),
        });
        return;
      }

      const registrations = result.data ?? [];
      const nextPage = result.pagination?.page ?? page;
      const totalPages = result.pagination?.total_pages ?? 1;

      if (registrations.length === 0) {
        setRegistrationsState({ status: "empty" });
        return;
      }

      setRegistrationsState({
        status: "success",
        registrations,
        page: nextPage,
        totalPages,
      });
    },
    [connection],
  );

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    void loadRegistrations(state.event.id, registrationsPage);
  }, [loadRegistrations, registrationsPage, state]);

  const reloadRegistrations = useCallback(() => {
    if (state.status !== "success") {
      return Promise.resolve();
    }

    return loadRegistrations(state.event.id, registrationsPage);
  }, [loadRegistrations, registrationsPage, state]);

  return {
    state,
    registrationsState,
    setRegistrationsPage,
    reload: loadEvent,
    reloadRegistrations,
  };
}
