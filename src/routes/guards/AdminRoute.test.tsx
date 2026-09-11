import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AdminRoute from "./AdminRoute";

const mockSecurity = {
  loading: false,
  profileLoading: false,
  isAuthenticated: false,
  isAdmin: false,
};

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

function renderAdmin(path = "/admin/categorias") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={<p>inicio</p>}
        />
        <Route element={<AdminRoute />}>
          <Route
            path="/admin/categorias"
            element={<p>panel admin</p>}
          />
          <Route
            path="/admin/eventos"
            element={<p>eventos admin</p>}
          />
          <Route
            path="/admin/inscripciones"
            element={<p>inscripciones admin</p>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  afterEach(() => {
    mockSecurity.loading = false;
    mockSecurity.profileLoading = false;
    mockSecurity.isAuthenticated = false;
    mockSecurity.isAdmin = false;
  });

  test("redirects a non-admin from /admin/inscripciones to home", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = false;

    renderAdmin("/admin/inscripciones");

    expect(await screen.findByText("inicio")).toBeInTheDocument();
    expect(screen.queryByText("inscripciones admin")).not.toBeInTheDocument();
  });

  test("allows an admin", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = true;

    renderAdmin();

    expect(await screen.findByText("panel admin")).toBeInTheDocument();
  });

  test("does not redirect while session loading", () => {
    mockSecurity.loading = true;

    renderAdmin();

    expect(screen.getByText("Verificando permisos...")).toBeInTheDocument();
    expect(screen.queryByText("inicio")).not.toBeInTheDocument();
    expect(screen.queryByText("panel admin")).not.toBeInTheDocument();
  });
});
