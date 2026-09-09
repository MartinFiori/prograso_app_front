import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";

const mockSecurity = {
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAdmin: false,
  user: null,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

describe("Navbar", () => {
  afterEach(() => {
    mockSecurity.isAuthenticated = false;
    mockSecurity.isAdmin = false;
  });

  test("shows Admin link to /admin for admins and not Categorías", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = true;

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Sitio" })).toBeInTheDocument();

    const adminLink = screen.getByRole("link", { name: "Admin" });
    expect(adminLink).toHaveAttribute("href", "/admin");
    expect(screen.queryByRole("link", { name: "Categorías" })).not.toBeInTheDocument();
  });

  test("hides Admin for a regular user", () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = false;

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });
});
