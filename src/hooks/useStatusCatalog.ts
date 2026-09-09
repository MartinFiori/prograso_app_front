import { useCallback, useEffect, useState } from "react";

import type { ApiResponse } from "../types";
import type { CatalogStatus } from "../types/admin";
import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import { formatConnectionError } from "../utils/apiError";

type CatalogState =
  | { status: "loading" }
  | { status: "success"; items: CatalogStatus[] }
  | { status: "error"; message: string };

export function useStatusCatalog(path: string) {
  const connection = useConnection();
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const result = await connection<ApiResponse<CatalogStatus[]>>({
      url: path,
      requiresAuth: false,
    });

    if (isConnectionError(result)) {
      setState({ status: "error", message: formatConnectionError(result) });
      return;
    }

    setState({ status: "success", items: result.data ?? [] });
  }, [connection, path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
