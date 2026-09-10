import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";
import type { MeProfile } from "../../types/me";

const mockSecurity = {
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAdmin: false,
  user: null as {
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  } | null,
  profile: null as MeProfile | null,
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
    mockSecurity.profile = null;
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

  test("links avatar and name to profile without a header logout", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = {
      id: "1",
      role: "user",
      name: "Ada",
      avatar_url: null,
      category: null,
      gender: null,
      phone_number: null,
    };

    renderNavbar();

    expect(
      screen.getByRole("link", { name: "Mi perfil, Ada" }),
    ).toHaveAttribute("href", "/profile");
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).not.toBeInTheDocument();
  });

  test("falls back to Usuario when there is no name", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { user_metadata: {} };

    renderNavbar();

    expect(
      screen.getByRole("link", { name: "Mi perfil, Usuario" }),
    ).toBeInTheDocument();
  });

  test("keeps Admin for admin role", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = true;
    mockSecurity.profile = {
      id: "1",
      role: "admin",
      name: "Ada",
      avatar_url: null,
      category: null,
      gender: null,
      phone_number: null,
    };

    renderNavbar();

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
