import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import UserDetailPage from "./UserDetailPage";
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

const userId = "11111111-1111-4111-8111-111111111111";

const userPayload = {
  id: userId,
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
};

function successBody(data: unknown, statusCode = 200) {
  return {
    status: "success",
    statusCode,
    description: "OK",
    data,
  };
}

describe("UserDetailPage", () => {
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

  test("can change the user role", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === "PATCH" && String(url).includes("/role")) {
        return jsonResponse(successBody({ ...userPayload, role: "admin" }));
      }

      if (String(url).includes(`/admin/users/${userId}`)) {
        return jsonResponse(successBody(userPayload));
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={[`/admin/usuarios/${userId}`]}>
        <Routes>
          <Route
            path="/admin/usuarios/:userId"
            element={<UserDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByDisplayValue("user"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Cambiar rol" }));

    await waitFor(() => {
      const roleCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1]?.method === "PATCH" && String(call[0]).includes("/role"),
      );
      expect(roleCall).toBeDefined();
      expect(roleCall?.[1]?.body).toBe(JSON.stringify({ role: "admin" }));
    });
  });
})
