import { useCallback, useEffect, useState } from "react";

import type { ApiPagination, ApiResponse } from "../types";
import type {
  AdminUser,
  InviteUserBody,
  ListAdminUsersQuery,
} from "../types/admin";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import {
  authSuspensionPath,
  deleteAdminUserPath,
  eventRegistrationBlockPath,
  getAdminUserPath,
  inviteAdminUserPath,
  listAdminUsersPath,
  parseUserIdParam,
  updateAdminUserPath,
  updateAdminUserRolePath,
} from "../services/adminUsersApi";
import { formatConnectionError } from "../utils/apiError";

export { parseUserIdParam };

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      users: AdminUser[];
      pagination: ApiPagination | null;
      refreshing?: boolean;
    }
  | { status: "error"; message: string };

type DetailState =
  | { status: "loading" }
  | { status: "success"; user: AdminUser }
  | { status: "not-found" }
  | { status: "invalid-id" }
  | { status: "error"; message: string };

export function useAdminUserList(query: ListAdminUsersQuery) {
  const connection = useConnection();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const page = query.page ?? 1;
  const limit = query.limit;
  const q = query.q ?? "";
  const sort = query.sort;

  const load = useCallback(async () => {
    setState((current) =>
      current.status === "success"
        ? { ...current, refreshing: true }
        : { status: "loading" },
    );

    const result = await connection<ApiResponse<AdminUser[]>>({
      url: listAdminUsersPath({ page, limit, q, sort }),
    });

    if (isConnectionError(result)) {
      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({
      status: "success",
      users: result.data ?? [],
      pagination: result.pagination ?? null,
    });
  }, [connection, limit, page, q, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = useCallback(
    async (body: InviteUserBody): Promise<string | null> => {
      const result = await connection<ApiResponse<AdminUser>>({
        method: "POST",
        url: inviteAdminUserPath(),
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

  return { state, reload: load, invite };
}

export function useAdminUserDetail(rawId: string | undefined) {
  const connection = useConnection();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const userId = parseUserIdParam(rawId);

  const load = useCallback(async () => {
    if (userId === null) {
      setState({ status: "invalid-id" });
      return;
    }

    setState({ status: "loading" });

    const result = await connection<ApiResponse<AdminUser>>({
      url: getAdminUserPath(userId),
    });

    if (isConnectionError(result)) {
      if (result.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({ status: "success", user: result.data });
  }, [connection, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (
      request: () => ReturnType<typeof connection>,
    ): Promise<string | null> => {
      const result = await request();

      if (isConnectionError(result)) {
        return formatConnectionError(result);
      }

      await load();
      return null;
    },
    [load],
  );

  const updateProfile = useCallback(
    async (body: { name?: string; avatar_url?: string | null }) => {
      if (userId === null) {
        return "Identificador inválido.";
      }

      return run(() =>
        connection<ApiResponse<AdminUser>>({
          method: "PATCH",
          url: updateAdminUserPath(userId),
          body,
        }),
      );
    },
    [connection, run, userId],
  );

  const updateRole = useCallback(
    async (role: "admin" | "user") => {
      if (userId === null) {
        return "Identificador inválido.";
      }

      return run(() =>
        connection<ApiResponse<AdminUser>>({
          method: "PATCH",
          url: updateAdminUserRolePath(userId),
          body: { role },
        }),
      );
    },
    [connection, run, userId],
  );

  const putBlock = useCallback(
    async (body: { reason: string; blocked_until?: string | null }) => {
      if (userId === null) {
        return "Identificador inválido.";
      }

      return run(() =>
        connection<ApiResponse<AdminUser>>({
          method: "PUT",
          url: eventRegistrationBlockPath(userId),
          body,
        }),
      );
    },
    [connection, run, userId],
  );

  const deleteBlock = useCallback(async () => {
    if (userId === null) {
      return "Identificador inválido.";
    }

    return run(() =>
      connection<ApiResponse<AdminUser>>({
        method: "DELETE",
        url: eventRegistrationBlockPath(userId),
      }),
    );
  }, [connection, run, userId]);

  const putSuspension = useCallback(
    async (body: { reason: string; ban_duration: string }) => {
      if (userId === null) {
        return "Identificador inválido.";
      }

      return run(() =>
        connection<ApiResponse<AdminUser>>({
          method: "PUT",
          url: authSuspensionPath(userId),
          body,
        }),
      );
    },
    [connection, run, userId],
  );

  const deleteSuspension = useCallback(async () => {
    if (userId === null) {
      return "Identificador inválido.";
    }

    return run(() =>
      connection<ApiResponse<AdminUser>>({
        method: "DELETE",
        url: authSuspensionPath(userId),
      }),
    );
  }, [connection, run, userId]);

  const remove = useCallback(async () => {
    if (userId === null) {
      return "Identificador inválido.";
    }

    const result = await connection({
      method: "DELETE",
      url: deleteAdminUserPath(userId),
    });

    if (isConnectionError(result)) {
      return formatConnectionError(result);
    }

    return null;
  }, [connection, userId]);

  return {
    state,
    userId,
    reload: load,
    updateProfile,
    updateRole,
    putBlock,
    deleteBlock,
    putSuspension,
    deleteSuspension,
    remove,
  };
}
