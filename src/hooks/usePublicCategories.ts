import { useCallback, useEffect, useState } from "react";

import {
  isConnectionError,
  useConnection,
  type ConnectionError,
} from "./useConnection";
import { listCategoriesPath } from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type { EventCategory } from "../types/events";

export type PublicCategoriesState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "success"; categories: EventCategory[] }
  | { status: "error"; message: string; errorCode?: string };

function readErrorCode(error: ConnectionError): string | undefined {
  return typeof error.errorCode === "string" ? error.errorCode : undefined;
}

export function usePublicCategories() {
  const connection = useConnection();
  const [state, setState] = useState<PublicCategoriesState>({
    status: "loading",
  });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const result = await connection<ApiResponse<EventCategory[]>>({
      url: listCategoriesPath(),
      requiresAuth: false,
      abortRepeat: true,
    });

    if (isConnectionError(result)) {
      if (result.message === "Petición cancelada") {
        return;
      }

      setState({
        status: "error",
        message: result.message,
        errorCode: readErrorCode(result),
      });
      return;
    }

    const categories = result.data ?? [];

    if (categories.length === 0) {
      setState({ status: "empty" });
      return;
    }

    setState({ status: "success", categories });
  }, [connection]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
