import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import UsersList from "./UsersList";
import { supabase } from "../../../utils/supabase";

jest.mock("../../../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
    blob: async () => new Blob(),
  } as Response);
}

const usersBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      email: "ana@example.com",
      name: "Ana Gomez",
      avatar_url: null,
      role: "user",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      last_sign_in_at: null,
      email_confirmed_at: null,
      auth_suspended: false,
      banned_until: null,
      event_registration_access: {
        blocked: false,
        blocked_at: null,
        blocked_until: null,
      },
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
};

describe("UsersList", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("lists users with pagination and can invite", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === "POST" && String(url).includes("/invitations")) {
        return jsonResponse({ ...usersBody, statusCode: 201, data: usersBody.data[0] }, 201);
      }

      if (String(url).includes("/admin/users")) {
        return jsonResponse(usersBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/usuarios"]}>
        <Routes>
          <Route
            path="/admin/usuarios"
            element={<UsersList />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 1 \(1 usuarios\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ Crear usuario" }));
    const createDialog = await screen.findByRole("dialog", { name: "Crear usuario" });
    fireEvent.change(within(createDialog).getByLabelText(/Email/), {
      target: { value: "nueva@example.com" },
    });
    fireEvent.change(within(createDialog).getByLabelText(/Nombre/), {
      target: { value: "Nueva Persona" },
    });
    fireEvent.submit(within(createDialog).getByRole("button", { name: "Invitar" }).closest("form")!);

    await waitFor(() => {
      const inviteCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1]?.method === "POST",
      );
      expect(inviteCall).toBeDefined();
      expect(String(inviteCall?.[0])).toContain("/admin/users/invitations");
    });
  });

  test("can change the user role from Administrar", async () => {
    const userId = usersBody.data[0].id;

    (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === "PATCH" && String(url).includes("/role")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: { ...usersBody.data[0], role: "admin" },
        });
      }

      if (String(url).includes(`/admin/users/${userId}`)) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: usersBody.data[0],
        });
      }

      if (String(url).includes("/admin/users")) {
        return jsonResponse(usersBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/usuarios"]}>
        <Routes>
          <Route
            path="/admin/usuarios"
            element={<UsersList />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Administrar" }));
    const roleSelect = await screen.findByLabelText("Rol");
    await userEvent.selectOptions(roleSelect, "admin");
    await userEvent.click(screen.getByRole("button", { name: "Cambiar rol" }));

    await waitFor(() => {
      const roleCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1]?.method === "PATCH" && String(call[0]).includes("/role"),
      );
      expect(roleCall).toBeDefined();
      expect(roleCall?.[1]?.body).toBe(JSON.stringify({ role: "admin" }));
    });
  });
});
