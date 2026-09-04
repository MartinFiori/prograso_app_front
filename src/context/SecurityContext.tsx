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

export type SecurityContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
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
    const redirectTo = `/auth/callback`;

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

  console.log(user);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
    } catch (error: unknown) {
      console.error("Error cerrando sesión:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession]);

  const value = useMemo<SecurityContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      loadSession,
      setUser,
    }),
    [user, loading, login, logout, loadSession],
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
