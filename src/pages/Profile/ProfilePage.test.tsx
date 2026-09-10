import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ProfilePage from "./ProfilePage";
import type { MeProfile } from "../../types/me";
import type { ProfileLoadError } from "../../context/SecurityContext";

const mockLogout = jest.fn();
const mockRefreshProfile = jest.fn();
const mockApplyProfile = jest.fn();
const mockConnection = jest.fn();

const mockSecurity: {
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  profile: MeProfile | null;
  profileError: ProfileLoadError | null;
  user: { email?: string } | null;
  logout: typeof mockLogout;
  refreshProfile: typeof mockRefreshProfile;
  applyProfile: typeof mockApplyProfile;
} = {
  loading: false,
  profileLoading: false,
  isAuthenticated: false,
  profile: null,
  profileError: null,
  user: null,
  logout: mockLogout,
  refreshProfile: mockRefreshProfile,
  applyProfile: mockApplyProfile,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

jest.mock("../../hooks/useConnection", () => ({
  useConnection: () => mockConnection,
  isConnectionError: (result: { error?: boolean }) => result?.error === true,
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

const completeProfile: MeProfile = {
  id: "1",
  role: "user",
  name: "Ana",
  avatar_url: null,
  category: null,
  gender: null,
  phone_number: null,
};

describe("ProfilePage", () => {
  afterEach(() => {
    mockSecurity.loading = false;
    mockSecurity.profileLoading = false;
    mockSecurity.isAuthenticated = false;
    mockSecurity.profile = null;
    mockSecurity.profileError = null;
    mockSecurity.user = null;
    mockLogout.mockReset();
    mockRefreshProfile.mockReset();
    mockApplyProfile.mockReset();
    mockConnection.mockReset();
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

  test("shows a complete profile instead of redirecting home", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };

    renderProfile();

    expect(await screen.findByRole("heading", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ana@example.com")).toBeDisabled();
    expect(screen.getByLabelText("Teléfono")).toBeDisabled();
    expect(
      screen.getByText(
        "Elegí la categoría que mejor represente tu nivel. Si recién empezás sos 9na.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("inicio")).not.toBeInTheDocument();
  });

  test("shows a load error with retry", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profileError = {
      message: "Error HTTP 500",
      status: 500,
    };

    renderProfile();

    expect(await screen.findByText("Error HTTP 500")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mockRefreshProfile).toHaveBeenCalled();
  });

  test("shows a minimal incomplete-profile message", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profileError = {
      message: "Profile not found",
      errorCode: "profile_not_found",
      status: 404,
    };

    renderProfile();

    expect(
      await screen.findByText("Tu perfil todavía no está completo"),
    ).toBeInTheDocument();
  });

  test("can start and cancel name editing", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    const nameInput = screen.getByLabelText("Nombre y apellido");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Ana Gomez");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar" }),
    ).not.toBeInTheDocument();
  });

  test("sends the exact name payload when saving", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };
    mockConnection.mockResolvedValue({
      data: { ...completeProfile, name: "Ana Gomez" },
    });

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    const nameInput = screen.getByLabelText("Nombre y apellido");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "  Ana Gomez  ");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Perfil actualizado.")).toBeInTheDocument();
    expect(mockConnection).toHaveBeenCalledWith({
      method: "PATCH",
      url: "/me",
      body: {
        name: "Ana Gomez",
        category: null,
        gender: null,
        phone_number: null,
      },
    });
    expect(mockApplyProfile).toHaveBeenCalledWith({
      ...completeProfile,
      name: "Ana Gomez",
    });
  });

  test("saves category gender and phone", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };
    mockConnection.mockResolvedValue({
      data: {
        ...completeProfile,
        category: "7ma",
        gender: "Femenino",
        phone_number: "+541130483185",
      },
    });

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    await userEvent.click(screen.getByRole("radio", { name: "7ma" }));
    await userEvent.click(screen.getByRole("radio", { name: "Femenino" }));
    await userEvent.type(screen.getByLabelText("Teléfono"), "1130483185");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mockConnection).toHaveBeenCalledWith({
      method: "PATCH",
      url: "/me",
      body: {
        name: "Ana",
        category: "7ma",
        gender: "Femenino",
        phone_number: "+541130483185",
      },
    });
  });

  test("shows backend save errors", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };
    mockConnection.mockResolvedValue({
      error: true,
      message: "Validation failed",
    });

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
  });

  test("logout uses the existing implementation", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.profile = completeProfile;
    mockSecurity.user = { email: "ana@example.com" };
    mockLogout.mockResolvedValue(undefined);

    renderProfile();

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(mockLogout).toHaveBeenCalled();
  });
});
