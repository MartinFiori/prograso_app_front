import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../utils/supabase";
import { getAuthRedirectTo } from "../utils/appUrl";
import { authLog } from "../utils/authLog";
import {
  isConnectionError,
  useConnection,
} from "../hooks/useConnection";
import type { ConnectionError } from "../hooks/useConnection";
import { getMePath } from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type { MeProfile } from "../types/me";

export type ProfileLoadError = {
  message: string;
  errorCode?: string;
  status: number;
};

export type SecurityContextType = {
  user: User | null;
  loading: boolean;
  profile: MeProfile | null;
  profileLoading: boolean;
  profileError: ProfileLoadError | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyProfile: (next: MeProfile) => void;
};

type SecurityProviderProps = {
  children: ReactNode;
};

export const SecurityContext = createContext<SecurityContextType | null>(null);

function toProfileLoadError(result: ConnectionError): ProfileLoadError {
  return {
    message: result.message,
    errorCode:
      typeof result.errorCode === "string" ? result.errorCode : undefined,
    status: result.status,
  };
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<ProfileLoadError | null>(
    null,
  );
  const connection = useConnection();

  const loadSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setUser(session?.user ?? null);
      authLog("getSession", { hasUser: Boolean(session?.user) });
    } catch (error: unknown) {
      authLog("getSession error", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    const redirectTo = getAuthRedirectTo();
    authLog("login start", { redirectTo });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      authLog("login error", { message: error.message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    authLog("logout start");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setProfile(null);
      setProfileError(null);
      authLog("logout ok");
    } catch (error: unknown) {
      authLog("logout error", {
        message: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const userId = user?.id;

    if (!userId) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const result = await connection<ApiResponse<MeProfile>>({
      url: getMePath(),
    });

    if (isConnectionError(result)) {
      setProfile(null);
      setProfileError(toProfileLoadError(result));
    } else {
      setProfile(result.data);
      setProfileError(null);
    }

    setProfileLoading(false);
  }, [connection, user?.id]);

  const applyProfile = useCallback((next: MeProfile) => {
    setProfile(next);
    setProfileError(null);
  }, []);

  useEffect(() => {
    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      authLog("onAuthStateChange", {
        event,
        hasUser: Boolean(session?.user),
      });
      setUser(session?.user ?? null);

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT"
      ) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const value = useMemo<SecurityContextType>(
    () => ({
      user,
      loading,
      profile,
      profileLoading,
      profileError,
      isAuthenticated: Boolean(user),
      isAdmin: profile?.role === "admin",
      login,
      logout,
      loadSession,
      refreshProfile: fetchProfile,
      applyProfile,
    }),
    [
      user,
      loading,
      profile,
      profileLoading,
      profileError,
      login,
      logout,
      loadSession,
      fetchProfile,
      applyProfile,
    ],
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity(): SecurityContextType {
  const context = useContext(SecurityContext);

  if (!context) {
    throw new Error("useSecurity debe utilizarse dentro de SecurityProvider");
  }

  return context;
}
