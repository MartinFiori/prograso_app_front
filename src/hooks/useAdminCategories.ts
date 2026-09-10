import { useCallback, useEffect, useState } from "react";

import {
  isConnectionError,
  useConnection,
} from "./useConnection";
import {
  createCategoryPath,
  deleteCategoryPath,
  getCategoryByIdPath,
  listCategoriesPath,
  parseEventIdParam,
  updateCategoryPath,
} from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type { EventCategory } from "../types/events";

export { parseEventIdParam as parseCategoryIdParam };

type ListState =
  | { status: "loading" }
  | { status: "success"; categories: EventCategory[]; refreshing?: boolean }
  | { status: "error"; message: string };

type DetailState =
  | { status: "loading" }
  | { status: "success"; category: EventCategory }
  | { status: "not-found" }
  | { status: "invalid-id" }
  | { status: "error"; message: string };

function errorMessage(result: { message?: string }): string {
  return result.message || "No se pudo completar la operación.";
}

export function useAdminCategoryList() {
  const connection = useConnection();
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async () => {
    setState((current) =>
      current.status === "success"
        ? { ...current, refreshing: true }
        : { status: "loading" },
    );

    const result = await connection<ApiResponse<EventCategory[]>>({
      url: listCategoriesPath(),
      requiresAuth: false,
    });

    if (isConnectionError(result)) {
      setState({ status: "error", message: errorMessage(result) });
      return;
    }

    setState({ status: "success", categories: result.data ?? [] });
  }, [connection]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(
    async (id: number): Promise<string | null> => {
      const result = await connection({
        method: "DELETE",
        url: deleteCategoryPath(id),
      });

      if (isConnectionError(result)) {
        return errorMessage(result);
      }

      await load();
      return null;
    },
    [connection, load],
  );

  return { state, reload: load, remove };
}

export function useAdminCategoryDetail(rawId: string | undefined) {
  const connection = useConnection();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const id = parseEventIdParam(rawId);

  const load = useCallback(async () => {
    if (id === null) {
      setState({ status: "invalid-id" });
      return;
    }

    setState({ status: "loading" });

    const result = await connection<ApiResponse<EventCategory>>({
      url: getCategoryByIdPath(id),
      requiresAuth: false,
    });

    if (isConnectionError(result)) {
      if (result.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      setState({ status: "error", message: errorMessage(result) });
      return;
    }

    setState({ status: "success", category: result.data });
  }, [connection, id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, id, reload: load };
}

export function useAdminCategoryMutations() {
  const connection = useConnection();

  const create = useCallback(
    async (form: FormData) => {
      const result = await connection<ApiResponse<EventCategory>>({
        method: "POST",
        url: createCategoryPath(),
        body: form,
      });

      if (isConnectionError(result)) {
        return { error: errorMessage(result) };
      }

      return { category: result.data };
    },
    [connection],
  );

  const update = useCallback(
    async (categoryId: number, form: FormData) => {
      const result = await connection<ApiResponse<EventCategory>>({
        method: "PATCH",
        url: updateCategoryPath(categoryId),
        body: form,
      });

      if (isConnectionError(result)) {
        return { error: errorMessage(result) };
      }

      return { category: result.data };
    },
    [connection],
  );

  return { create, update };
}
