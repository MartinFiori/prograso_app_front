import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AuthCallback from "./AuthCallback";
import { supabase } from "../../utils/supabase";
import type { MeProfile } from "../../types/me";

const mockLogin = jest.fn();

const mockSecurity: {
  isAuthenticated: boolean;
  loading: boolean;
  profile: MeProfile | null;
  profileLoading: boolean;
  login: typeof mockLogin;
} = {
  isAuthenticated: false,
  loading: true,
  profile: null,
  profileLoading: false,
  login: mockLogin,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

jest.mock("../../utils/supabase", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

function renderCallback(path = "/auth/callback") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={<p>inicio</p>}
        />
        <Route
          path="/profile"
          element={<p>perfil minimo</p>}
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthCallback", () => {
  beforeEach(() => {
    mockSecurity.isAuthenticated = false;
    mockSecurity.loading = true;
    mockSecurity.profile = null;
    mockSecurity.profileLoading = false;
    mockLogin.mockReset();
  });

  test("shows an accessible processing state", async () => {
    renderCallback();

    expect(
      await screen.findByText("Estamos iniciando tu sesión"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Esto puede tardar unos segundos"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  test("navigates home when the profile is complete", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.loading = false;
    mockSecurity.profileLoading = false;
    mockSecurity.profile = {
      id: "1",
      role: "user",
      name: "Ana",
      avatar_url: null,
    };

    renderCallback();

    expect(await screen.findByText("inicio")).toBeInTheDocument();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  test("navigates to profile when the name is missing", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.loading = false;
    mockSecurity.profileLoading = false;
    mockSecurity.profile = null;

    renderCallback();

    expect(await screen.findByText("perfil minimo")).toBeInTheDocument();
  });

  test("waits while the profile is loading", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.loading = false;
    mockSecurity.profileLoading = true;

    renderCallback();

    expect(
      screen.getByText("Estamos iniciando tu sesión"),
    ).toBeInTheDocument();
    expect(screen.queryByText("inicio")).not.toBeInTheDocument();
    expect(screen.queryByText("perfil minimo")).not.toBeInTheDocument();
  });

  test("shows a recoverable error from the OAuth query", async () => {
    renderCallback("/auth/callback?error=access_denied");

    expect(
      await screen.findByText("No pudimos iniciar tu sesión"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Intentar nuevamente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver al inicio" }),
    ).toBeInTheDocument();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Intentar nuevamente" }),
    );
    expect(mockLogin).toHaveBeenCalled();
  });
});
