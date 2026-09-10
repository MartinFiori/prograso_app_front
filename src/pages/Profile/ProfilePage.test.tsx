import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ProfilePage from "./ProfilePage";
import type { MeProfile } from "../../types/me";

const mockSecurity: {
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  profile: MeProfile | null;
} = {
  loading: false,
  profileLoading: false,
  isAuthenticated: false,
  profile: null,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route
          path="/"
          element={<p>inicio</p>}
        />
        <Route
          path="/profile"
          element={<ProfilePage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  afterEach(() => {
    mockSecurity.loading = false;
    mockSecurity.profileLoading = false;
    mockSecurity.isAuthenticated = false;
    mockSecurity.profile = null;
  });

  test("waits while auth is loading", () => {
    mockSecurity.loading = true;

    renderProfile();

    expect(screen.getByText("Cargando tu perfil...")).toBeInTheDocument();
    expect(screen.queryByText("inicio")).not.toBeInTheDocument();
  });

  test("sends anonymous users home", async () => {
    renderProfile();

    expect(await screen.findByText("inicio")).toBeInTheDocument();
  });

  test("sends a complete profile home", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = {
      id: "1",
      role: "user",
      name: "Ana",
      avatar_url: null,
    };

    renderProfile();

    expect(await screen.findByText("inicio")).toBeInTheDocument();
  });

  test("shows a minimal incomplete-profile message", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = null;

    renderProfile();

    expect(
      await screen.findByText("Tu perfil todavía no está completo"),
    ).toBeInTheDocument();
  });
});
