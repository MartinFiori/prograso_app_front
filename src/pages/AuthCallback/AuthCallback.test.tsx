import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AuthCallback from "./AuthCallback";
import { supabase } from "../../utils/supabase";

const mockSecurity = {
  isAuthenticated: false,
  loading: true,
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

function renderCallback() {
  return render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <Routes>
        <Route
          path="/"
          element={<p>inicio</p>}
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
    window.history.pushState({}, "", "/auth/callback");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  test("shows a processing state", async () => {
    renderCallback();

    expect(await screen.findByText("Iniciando sesión...")).toBeInTheDocument();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  test("navigates home when the session exists", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.loading = false;

    renderCallback();

    expect(await screen.findByText("inicio")).toBeInTheDocument();
  });

  test("shows a friendly error from the OAuth query", async () => {
    window.history.pushState({}, "", "/auth/callback?error=access_denied");

    renderCallback();

    expect(
      await screen.findByText("No pudimos iniciar sesión"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver al inicio" }),
    ).toBeInTheDocument();
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
