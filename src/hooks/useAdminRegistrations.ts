import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiResponse } from "../types";
import type { EventStatus } from "../types/events";
import type {
  AdminEvent,
  AdminRegistration,
  AdminUser,
  CatalogStatus,
  RegistrationListMeta,
} from "../types/admin";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import { listRegistrationStatusesPath } from "../services/adminApi";
import { listAdminUsersPath } from "../services/adminUsersApi";
import {
  listAdminEventsPath,
  listAdminRegistrationsPath,
  listStatusesPath,
  parseEventIdParam,
  createAdminRegistrationPath,
  updateAdminRegistrationPath,
  deleteAdminRegistrationPath,
  markAdminRegistrationPaidPath,
} from "../services/eventsApi";
import { formatConnectionError } from "../utils/apiError";

export { parseEventIdParam };

export const ADMIN_REGISTRATIONS_TABLE_LIMIT = 20;
export const ADMIN_REGISTRATIONS_LOAD_LIMIT = 100;
export const ADMIN_EVENTS_LOAD_LIMIT = 100;
export const ADMIN_USERS_LOAD_LIMIT = 100;

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      registrations: AdminRegistration[];
      meta: RegistrationListMeta | null;
      emails: Record<string, string | null>;
    }
  | { status: "error"; message: string };

async function collectAdminEvents(
  connection: ReturnType<typeof useConnection>,
): Promise<AdminEvent[] | { error: string }> {
  const collected: AdminEvent[] = [];
  let page = 1;

  while (true) {
    const result = await connection<ApiResponse<AdminEvent[]>>({
      url: listAdminEventsPath({ page, limit: ADMIN_EVENTS_LOAD_LIMIT }),
    });

    if (isConnectionError(result)) {
      return { error: formatConnectionError(result) };
    }

    collected.push(...(result.data ?? []));
    const totalPages = result.pagination?.total_pages ?? 1;

    if (page >= totalPages || (result.data ?? []).length === 0) {
      break;
    }

    page += 1;
  }

  return collected;
}

async function collectRegistrations(
  connection: ReturnType<typeof useConnection>,
  eventId: number,
): Promise<
  | {
      registrations: AdminRegistration[];
      meta: RegistrationListMeta | null;
    }
  | { error: string }
> {
  const collected: AdminRegistration[] = [];
  let meta: RegistrationListMeta | null = null;
  let page = 1;

  while (true) {
    const result = await connection<
      ApiResponse<AdminRegistration[]> & { meta?: RegistrationListMeta }
    >({
      url: listAdminRegistrationsPath(eventId, {
        page,
        limit: ADMIN_REGISTRATIONS_LOAD_LIMIT,
      }),
    });

    if (isConnectionError(result)) {
      return { error: formatConnectionError(result) };
    }

    collected.push(...(result.data ?? []));
    meta = result.meta ?? meta;
    const totalPages = result.pagination?.total_pages ?? 1;

    if (page >= totalPages || (result.data ?? []).length === 0) {
      break;
    }

    page += 1;
  }

  return { registrations: collected, meta };
}

async function hydrateEmails(
  connection: ReturnType<typeof useConnection>,
  userIds: string[],
): Promise<Record<string, string | null>> {
  const emails: Record<string, string | null> = {};

  if (userIds.length === 0) {
    return emails;
  }

  const listed = await connection<ApiResponse<AdminUser[]>>({
    url: listAdminUsersPath({ page: 1, limit: ADMIN_USERS_LOAD_LIMIT }),
  });

  if (!isConnectionError(listed)) {
    for (const user of listed.data ?? []) {
      emails[user.id] = user.email;
    }
  }

  return emails;
}

export function useAdminEventsOptions() {
  const connection = useConnection();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [statuses, setStatuses] = useState<EventStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [eventsResult, statusesResult] = await Promise.all([
        collectAdminEvents(connection),
        connection<ApiResponse<EventStatus[]>>({
          url: listStatusesPath(),
          requiresAuth: false,
        }),
      ]);

      if (cancelled) {
        return;
      }

      setLoading(false);

      if ("error" in eventsResult) {
        setError(eventsResult.error);
        return;
      }

      setEvents(eventsResult);

      if (!isConnectionError(statusesResult)) {
        setStatuses(statusesResult.data ?? []);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { events, statuses, error, loading };
}

export function useRegistrationStatuses() {
  const connection = useConnection();
  const [statuses, setStatuses] = useState<CatalogStatus[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await connection<ApiResponse<CatalogStatus[]>>({
        url: listRegistrationStatusesPath(),
        requiresAuth: false,
      });

      if (cancelled || isConnectionError(result)) {
        return;
      }

      setStatuses(result.data ?? []);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return statuses;
}

export function useAdminRegistrations(eventId: number | null) {
  const connection = useConnection();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;

    if (eventId === null) {
      setState({
        status: "success",
        registrations: [],
        meta: null,
        emails: {},
      });
      return;
    }

    setState({ status: "loading" });

    const collected = await collectRegistrations(connection, eventId);

    if (current !== requestId.current) {
      return;
    }

    if ("error" in collected) {
      setState({ status: "error", message: collected.error });
      return;
    }

    const emails = await hydrateEmails(
      connection,
      collected.registrations.map((row) => row.user_id),
    );

    if (current !== requestId.current) {
      return;
    }

    setState({
      status: "success",
      registrations: collected.registrations,
      meta: collected.meta,
      emails,
    });
  }, [connection, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (userId: string): Promise<string | null> => {
      if (eventId === null) {
        return "Elegí un evento.";
      }

      const result = await connection<ApiResponse<AdminRegistration>>({
        method: "POST",
        url: createAdminRegistrationPath(eventId),
        body: { user_id: userId },
      });

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [connection, eventId, load],
  );

  const update = useCallback(
    async (
      registrationId: number,
      body: { status_code?: string; waitlist_position?: number | null },
    ): Promise<string | null> => {
      const result = await connection<ApiResponse<AdminRegistration>>({
        method: "PATCH",
        url: updateAdminRegistrationPath(registrationId),
        body,
      });

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [connection, load],
  );

  const remove = useCallback(
    async (registrationId: number): Promise<string | null> => {
      const result = await connection<ApiResponse<AdminRegistration>>({
        method: "DELETE",
        url: deleteAdminRegistrationPath(registrationId),
      });

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [connection, load],
  );

  const markPaid = useCallback(
    async (userId: string): Promise<string | null> => {
      if (eventId === null) {
        return "Elegí un evento.";
      }

      const result = await connection<ApiResponse<AdminRegistration>>({
        method: "PATCH",
        url: markAdminRegistrationPaidPath(eventId, userId),
        body: {},
      });

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [connection, eventId, load],
  );

  return {
    state,
    reload: load,
    create,
    update,
    remove,
    markPaid,
  };
}
