import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SecurityProvider, useSecurity } from "./SecurityContext";
import { supabase } from "../utils/supabase";

jest.mock("../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("../utils/appUrl", () => ({
  getAuthRedirectTo: () => "https://app.example/auth/callback",
}));

jest.mock("../hooks/useConnection", () => ({
  useConnection: () => jest.fn().mockResolvedValue({ data: null }),
  isConnectionError: () => false,
}));

const unsubscribe = jest.fn();

function Probe() {
  const { login, logout, isAuthenticated, loading } = useSecurity();

  return (
    <div>
      <p>{loading ? "cargando" : "listo"}</p>
      <p>{isAuthenticated ? "autenticado" : "anonimo"}</p>
      <button
        type="button"
        onClick={() => {
          void login();
        }}
      >
        login
      </button>
      <button
        type="button"
        onClick={() => {
          void logout();
        }}
      >
        logout
      </button>
    </div>
  );
}

describe("SecurityProvider", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
      error: null,
    });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://app.example" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  test("login sends redirectTo for /auth/callback", async () => {
    render(
      <SecurityProvider>
        <Probe />
      </SecurityProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: "https://app.example/auth/callback" },
      });
    });
  });

  test("restores a session from getSession", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    render(
      <SecurityProvider>
        <Probe />
      </SecurityProvider>,
    );

    expect(screen.getByText("cargando")).toBeInTheDocument();
    expect(await screen.findByText("autenticado")).toBeInTheDocument();
    expect(screen.getByText("listo")).toBeInTheDocument();
  });

  test("logout clears the user", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    render(
      <SecurityProvider>
        <Probe />
      </SecurityProvider>,
    );

    expect(await screen.findByText("autenticado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
    expect(await screen.findByText("anonimo")).toBeInTheDocument();
  });
});
