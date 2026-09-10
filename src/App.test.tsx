import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RoutesPage from "./routes/RoutesPage";

jest.mock("./context/SecurityContext", () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  useSecurity: () => ({
    isAuthenticated: false,
    loading: true,
    login: jest.fn(),
    logout: jest.fn(),
    isAdmin: false,
    user: null,
    profile: null,
    profileLoading: false,
    loadSession: jest.fn(),
  }),
}));

test("keeps the auth callback route", async () => {
  render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <RoutesPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("Iniciando sesión...")).toBeInTheDocument();
});
