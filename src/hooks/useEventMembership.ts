import { useCallback, useEffect, useState } from "react";

import { useSecurity } from "../context/SecurityContext";
import type { ApiResponse } from "../types";
import type { UserEventRegistration } from "../types/events";
import {
  getMyRegistrationPath,
  registerForEventPath,
  unregisterFromEventPath,
} from "../services/eventsApi";
import { formatConnectionError } from "../utils/apiError";
import { isConnectionError, useConnection } from "./useConnection";

export type MembershipState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "not-joined" }
  | { status: "joined"; registration: UserEventRegistration }
  | { status: "error"; message: string; errorCode?: string };

function errorCodeOf(result: { errorCode?: unknown }): string | undefined {
  return typeof result.errorCode === "string" ? result.errorCode : undefined;
}

export function useEventMembership(eventId: number | null) {
  const connection = useConnection();
  const { user, isAuthenticated, login } = useSecurity();
  const [state, setState] = useState<MembershipState>(
    eventId === null ? { status: "idle" } : { status: "loading" },
  );
  const [inFlight, setInFlight] = useState(false);

  const hydrate = useCallback(async () => {
    if (eventId === null) {
      setState({ status: "idle" });
      return;
    }

    if (!isAuthenticated || !user) {
      setState({ status: "anonymous" });
      return;
    }

    setState({ status: "loading" });

    const result = await connection<ApiResponse<UserEventRegistration>>({
      url: getMyRegistrationPath(eventId),
    });

    if (isConnectionError(result)) {
      const code = errorCodeOf(result);

      if (code === "registration_not_found") {
        setState({ status: "not-joined" });
        return;
      }

      setState({
        status: "error",
        message: formatConnectionError(result),
        errorCode: code,
      });
      return;
    }

    if (!result.data) {
      setState({ status: "not-joined" });
      return;
    }

    setState({ status: "joined", registration: result.data });
  }, [connection, eventId, isAuthenticated, user]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const join = useCallback(async (): Promise<boolean> => {
    if (eventId === null || inFlight) {
      return false;
    }

    if (!isAuthenticated || !user) {
      await login();
      return false;
    }

    setInFlight(true);

    const result = await connection<ApiResponse<UserEventRegistration>>({
      method: "POST",
      url: registerForEventPath(eventId),
      body: {},
    });

    if (isConnectionError(result)) {
      const code = errorCodeOf(result);

      if (code === "registration_already_exists") {
        await hydrate();
        setInFlight(false);
        return true;
      }

      setState({
        status: "error",
        message: formatConnectionError(result),
        errorCode: code,
      });
      setInFlight(false);
      return false;
    }

    if (result.data) {
      setState({ status: "joined", registration: result.data });
    } else {
      await hydrate();
    }

    setInFlight(false);
    return true;
  }, [connection, eventId, hydrate, inFlight, isAuthenticated, login, user]);

  const leave = useCallback(async (): Promise<boolean> => {
    if (eventId === null || inFlight) {
      return false;
    }

    setInFlight(true);

    const result = await connection<ApiResponse<UserEventRegistration>>({
      method: "DELETE",
      url: unregisterFromEventPath(eventId),
    });

    if (isConnectionError(result)) {
      setState({
        status: "error",
        message: formatConnectionError(result),
        errorCode: errorCodeOf(result),
      });
      setInFlight(false);
      return false;
    }

    setState({ status: "not-joined" });
    setInFlight(false);
    return true;
  }, [connection, eventId, inFlight]);

  return { state, inFlight, join, leave, reload: hydrate };
}
