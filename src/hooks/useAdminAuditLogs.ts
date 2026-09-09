import { useCallback, useEffect, useState } from "react";

import type { ApiPagination, ApiResponse } from "../types";
import type { AuditLog, ListAuditLogsQuery } from "../types/admin";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import { listAuditLogsPath } from "../services/adminApi";
import { formatConnectionError } from "../utils/apiError";

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      logs: AuditLog[];
      pagination: ApiPagination | null;
    }
  | { status: "error"; message: string };

export function useAdminAuditLogs(query: ListAuditLogsQuery) {
  const connection = useConnection();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const targetUserId = query.target_user_id ?? "";
  const action = query.action ?? "";

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const result = await connection<ApiResponse<AuditLog[]>>({
      url: listAuditLogsPath({
        page,
        limit,
        target_user_id: targetUserId || undefined,
        action: action || undefined,
      }),
    });

    if (isConnectionError(result)) {
      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({
      status: "success",
      logs: result.data ?? [],
      pagination: result.pagination ?? null,
    });
  }, [action, connection, limit, page, targetUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
