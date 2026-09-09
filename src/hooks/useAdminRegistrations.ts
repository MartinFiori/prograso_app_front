import { useCallback, useEffect, useState } from "react";

import type { ApiPagination, ApiResponse } from "../types";
import type {
  AdminEvent,
  AdminRegistration,
  CatalogStatus,
  RegistrationListMeta,
} from "../types/admin";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import { listRegistrationStatusesPath } from "../services/adminApi";
import {
  listAdminEventsPath,
  listAdminRegistrationsPath,
  parseEventIdParam,
  syncAdminRegistrationsPath,
  updateAdminRegistrationPath,
} from "../services/eventsApi";
import { formatConnectionError } from "../utils/apiError";

export { parseEventIdParam };

export const ADMIN_REGISTRATIONS_TABLE_LIMIT = 20;
export const ADMIN_REGISTRATIONS_LOAD_LIMIT = 100;
export const ADMIN_DESIRED_SET_MAX = 500;

type SyncResult = {
  applied: unknown[];
  noops: unknown[];
  failures: { user_id: string; errorCode: string; description: string }[];
};

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      registrations: AdminRegistration[];
      pagination: ApiPagination | null;
      meta: RegistrationListMeta | null;
    }
  | { status: "error"; message: string };

export function useAdminEventsOptions() {
  const connection = useConnection();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await connection<ApiResponse<AdminEvent[]>>({
        url: listAdminEventsPath({ page: 1, limit: 100 }),
      });

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (isConnectionError(result)) {
        setError(formatConnectionError(result));
        return;
      }

      setEvents(result.data ?? []);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { events, error, loading };
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

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    unique.push(id);
  }

  return unique;
}

export function useAdminRegistrations(eventId: number | null) {
  const connection = useConnection();
  const [page, setPage] = useState(1);
  const [desiredUserIds, setDesiredUserIds] = useState<string[]>([]);
  const [roster, setRoster] = useState<AdminRegistration[]>([]);
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async () => {
    if (eventId === null) {
      setDesiredUserIds([]);
      setRoster([]);
      setState({
        status: "success",
        registrations: [],
        pagination: null,
        meta: null,
      });
      return;
    }

    setState({ status: "loading" });

    const collected: AdminRegistration[] = [];
    let meta: RegistrationListMeta | null = null;
    let total = 0;
    let loadPage = 1;

    while (true) {
      const result = await connection<
        ApiResponse<AdminRegistration[]> & { meta?: RegistrationListMeta }
      >({
        url: listAdminRegistrationsPath(eventId, {
          page: loadPage,
          limit: ADMIN_REGISTRATIONS_LOAD_LIMIT,
        }),
      });

      if (isConnectionError(result)) {
        setState({ status: "error", message: formatConnectionError(result) });
        return;
      }

      collected.push(...(result.data ?? []));
      meta = result.meta ?? meta;
      total = result.pagination?.total ?? collected.length;

      const totalPages = result.pagination?.total_pages ?? 1;

      if (loadPage >= totalPages || (result.data ?? []).length === 0) {
        break;
      }

      loadPage += 1;
    }

    const ids = uniqueIds(collected.map((row) => row.user_id));
    setDesiredUserIds(ids);
    setRoster(collected);
    setPage(1);
    setState({
      status: "success",
      registrations: collected.slice(0, ADMIN_REGISTRATIONS_TABLE_LIMIT),
      pagination: {
        page: 1,
        limit: ADMIN_REGISTRATIONS_TABLE_LIMIT,
        total,
        total_pages: Math.max(1, Math.ceil(total / ADMIN_REGISTRATIONS_TABLE_LIMIT)),
      },
      meta,
    });
  }, [connection, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRegistrations = roster.filter((row) =>
    desiredUserIds.includes(row.user_id),
  );
  const totalVisible = visibleRegistrations.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalVisible / ADMIN_REGISTRATIONS_TABLE_LIMIT) || 1,
  );
  const safePage = Math.min(page, totalPages);
  const pageRows = visibleRegistrations.slice(
    (safePage - 1) * ADMIN_REGISTRATIONS_TABLE_LIMIT,
    safePage * ADMIN_REGISTRATIONS_TABLE_LIMIT,
  );

  const listState: ListState =
    state.status === "success"
      ? {
          status: "success",
          registrations: pageRows,
          pagination: {
            page: safePage,
            limit: ADMIN_REGISTRATIONS_TABLE_LIMIT,
            total: totalVisible,
            total_pages: totalVisible === 0 ? 0 : totalPages,
          },
          meta: state.meta,
        }
      : state;

  const addDesired = useCallback((userId: string): string | null => {
    if (desiredUserIds.includes(userId)) {
      return null;
    }

    if (desiredUserIds.length >= ADMIN_DESIRED_SET_MAX) {
      return "El conjunto deseado no puede superar 500 usuarios.";
    }

    setDesiredUserIds((current) => uniqueIds([...current, userId]));
    return null;
  }, [desiredUserIds]);

  const removeDesired = useCallback((userId: string) => {
    setDesiredUserIds((current) => current.filter((id) => id !== userId));
  }, []);

  const sync = useCallback(async (): Promise<string | null> => {
    if (eventId === null) {
      return "Elegí un evento.";
    }

    const result = await connection<ApiResponse<SyncResult>>({
      method: "PUT",
      url: syncAdminRegistrationsPath(eventId),
      body: { user_ids: desiredUserIds },
    });

    if (isConnectionError(result)) {
      return formatConnectionError(result);
    }

    const failures = result.data?.failures ?? [];

    await load();

    if (failures.length > 0) {
      return failures
        .map((failure) => `${failure.user_id}: ${failure.errorCode}`)
        .join("; ");
    }

    return null;
  }, [connection, desiredUserIds, eventId, load]);

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

  return {
    state: listState,
    page: safePage,
    setPage,
    reload: load,
    desiredUserIds,
    addDesired,
    removeDesired,
    sync,
    update,
  };
}
