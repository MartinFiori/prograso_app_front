import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";

const mockSecurity = {
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAdmin: false,
  user: null as { user_metadata?: { full_name?: string } } | null,
  loading: false,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

function renderNavbar(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    mockSecurity.login.mockReset();
    mockSecurity.logout.mockReset();
    mockSecurity.isAuthenticated = false;
    mockSecurity.isAdmin = false;
    mockSecurity.user = null;
    mockSecurity.loading = false;
  });

  test("disables login while redirecting to Google", async () => {
    mockSecurity.login.mockReturnValue(new Promise(() => undefined));

    renderNavbar();

    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      screen.getByRole("button", { name: "Redirigiendo a Google…" }),
    ).toBeDisabled();
  });

  test("restores the login button when Google fails to open", async () => {
    mockSecurity.login.mockRejectedValue(new Error("oauth"));

    renderNavbar();

    await userEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("No pudimos abrir Google. Probá de nuevo."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeEnabled();
  });

  test("hides login on the auth callback route", () => {
    renderNavbar("/auth/callback");

    expect(
      screen.queryByRole("button", { name: "Iniciar sesión" }),
    ).not.toBeInTheDocument();
  });

  test("hides login while the session is loading", () => {
    mockSecurity.loading = true;

    renderNavbar();

    expect(
      screen.queryByRole("button", { name: "Iniciar sesión" }),
    ).not.toBeInTheDocument();
  });

  test("logout is available when authenticated", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { user_metadata: { full_name: "Ada" } };

    renderNavbar();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(mockSecurity.logout).toHaveBeenCalled();
  });
});
