import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import RegistrationsPage from "./RegistrationsPage";
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

const eventsBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [
    {
      id: 4,
      category_id: 2,
      title: "Encuentro del viernes",
      starts_at: "2026-09-20T21:00:00.000Z",
      registration_deadline: null,
      capacity: 16,
      price: null,
      status_code: "open",
      created_by: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-08T12:00:00.000Z",
      updated_at: "2026-09-08T12:00:00.000Z",
      category: { id: 2, name: "Cancha", image_url: null },
    },
  ],
};

const registrationsBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [
    {
      id: 12,
      event_id: 4,
      user_id: "11111111-1111-4111-8111-111111111111",
      status_code: "confirmed",
      waitlist_position: null,
      created_at: "2026-09-04T18:00:00.000Z",
      updated_at: "2026-09-04T18:00:00.000Z",
      profile: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Ana Gomez",
        avatar_url: null,
        role: "user",
      },
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
  meta: { capacity: 16, confirmed_count: 1, waitlisted_count: 1 },
};

describe("RegistrationsPage", () => {
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

  test("shows pagination and meta for an event", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const href = String(url);

      if (href.includes("/registration-statuses")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [{ code: "confirmed", label: "Confirmada", description: null }],
        });
      }

      if (href.includes("/admin/events/4/registrations")) {
        return jsonResponse(registrationsBody);
      }

      if (href.includes("/admin/events")) {
        return jsonResponse(eventsBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/inscripciones/4"]}>
        <Routes>
          <Route
            path="/admin/inscripciones/:eventId"
            element={<RegistrationsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    expect(screen.getByText(/Cupo: 16/)).toBeInTheDocument();
    expect(screen.getByText(/Confirmados: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 1 \(1 inscripciones\)/)).toBeInTheDocument();
  });

  test("picker searches admin users with limit 100", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const href = String(url);

      if (href.includes("/registration-statuses")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [{ code: "confirmed", label: "Confirmada", description: null }],
        });
      }

      if (href.includes("/admin/events/4/registrations")) {
        return jsonResponse(registrationsBody);
      }

      if (href.includes("/admin/users")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              email: "nuevo@example.com",
              name: "Nuevo",
              avatar_url: null,
              role: "user",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
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
          pagination: { page: 1, limit: 100, total: 1, total_pages: 1 },
        });
      }

      if (href.includes("/admin/events")) {
        return jsonResponse(eventsBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/inscripciones/4"]}>
        <Routes>
          <Route
            path="/admin/inscripciones/:eventId"
            element={<RegistrationsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Buscar usuarios"), "Nuevo");
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Nuevo")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/users\?.*limit=100/),
      expect.anything(),
    );
  });

  test("saves the full desired set, not only the visible page of 20", async () => {
    const members = Array.from({ length: 120 }, (_, index) => {
      const n = index + 1;
      const userId = `11111111-1111-4111-8111-${String(n).padStart(12, "0")}`;

      return {
        id: n,
        event_id: 4,
        user_id: userId,
        status_code: "confirmed",
        waitlist_position: null,
        created_at: "2026-09-04T18:00:00.000Z",
        updated_at: "2026-09-04T18:00:00.000Z",
        profile: {
          id: userId,
          name: `User ${n}`,
          avatar_url: null,
          role: "user",
        },
      };
    });

    let putBody: { user_ids?: string[] } | null = null;

    (global.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
      const href = String(url);

      if (href.includes("/registration-statuses")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [{ code: "confirmed", label: "Confirmada", description: null }],
        });
      }

      if (href.includes("/admin/events/4/registrations") && init?.method === "PUT") {
        putBody = JSON.parse(String(init.body));
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: { applied: [], noops: [], failures: [] },
        });
      }

      if (href.includes("/admin/events/4/registrations")) {
        const query = href.split("?")[1] ?? "";
        const params = new URLSearchParams(query);
        const page = Number(params.get("page") ?? "1");
        const limit = Number(params.get("limit") ?? "20");
        const start = (page - 1) * limit;
        const slice = members.slice(start, start + limit);

        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: slice,
          pagination: {
            page,
            limit,
            total: members.length,
            total_pages: Math.ceil(members.length / limit),
          },
          meta: { capacity: 200, confirmed_count: 120, waitlisted_count: 0 },
        });
      }

      if (href.includes("/admin/events")) {
        return jsonResponse(eventsBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/inscripciones/4"]}>
        <Routes>
          <Route
            path="/admin/inscripciones/:eventId"
            element={<RegistrationsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 20")).toBeInTheDocument();
    expect(screen.queryByText("User 21")).not.toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 6 \(120 inscripciones\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Guardar conjunto" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });

    expect(putBody?.user_ids).toHaveLength(120);
    expect(putBody?.user_ids).toContain("11111111-1111-4111-8111-000000000021");
    expect(putBody?.user_ids).toContain("11111111-1111-4111-8111-000000000120");
  });
});
