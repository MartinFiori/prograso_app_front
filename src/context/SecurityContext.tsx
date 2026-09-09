import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../utils/supabase";
import {
  isConnectionError,
  useConnection,
} from "../hooks/useConnection";
import { getMePath } from "../services/eventsApi";
import type { ApiResponse } from "../types";
import type { MeProfile } from "../types/me";

export type SecurityContextType = {
  user: User | null;
  loading: boolean;
  profile: MeProfile | null;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
};

type SecurityProviderProps = {
  children: ReactNode;
};

export const SecurityContext = createContext<SecurityContextType | null>(null);

export function SecurityProvider({ children }: SecurityProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const connection = useConnection();

  const loadSession = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setUser(session?.user ?? null);
    } catch (error: unknown) {
      console.error("Error obteniendo la sesión:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setProfile(null);
    } catch (error: unknown) {
      console.error("Error cerrando sesión:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
  }, []);

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    void connection<ApiResponse<MeProfile>>({ url: getMePath() }).then(
      (result) => {
        if (cancelled) {
          return;
        }

        if (isConnectionError(result)) {
          setProfile(null);
        } else {
          setProfile(result.data);
        }

        setProfileLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [user?.id, connection]);

  const value = useMemo<SecurityContextType>(
    () => ({
      user,
      loading,
      profile,
      profileLoading,
      isAuthenticated: Boolean(user),
      isAdmin: profile?.role === "admin",
      login,
      logout,
      loadSession,
      setUser,
    }),
    [user, loading, profile, profileLoading, login, logout, loadSession],
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
