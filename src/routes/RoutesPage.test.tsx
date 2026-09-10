import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RoutesPage from "./RoutesPage";
import { supabase } from "../utils/supabase";

const mockSecurity = {
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  loading: false,
  profile: null,
  profileLoading: false,
  loadSession: jest.fn(),
  setUser: jest.fn(),
};

jest.mock("../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
}));

jest.mock("../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      }),
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

describe("RoutesPage public redirects", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
    mockSecurity.isAuthenticated = false;
    mockSecurity.isAdmin = false;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("redirects /eventos to home categories", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/event-categories")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [],
        });
      }

      return jsonResponse({ status: "error" }, 500);
    }) as unknown as typeof fetch;

    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <RoutesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Eventos" })).toBeInTheDocument();
    expect(await screen.findByText("No hay categorías disponibles.")).toBeInTheDocument();
  });

  test("keeps /admin/eventos on the admin list", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.isAdmin = true;

    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/admin/events")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [
            {
              id: 12,
              category_id: 2,
              title: "Borrador interno",
              starts_at: "2026-09-20T21:00:00.000Z",
              registration_deadline: null,
              capacity: 16,
              price: 15000,
              status_code: "draft",
              created_by: "11111111-1111-4111-8111-111111111111",
              created_at: "2026-09-08T12:00:00.000Z",
              updated_at: "2026-09-08T12:00:00.000Z",
              category: { id: 2, name: "Cancha abierta", image_url: null },
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        });
      }

      return jsonResponse({ status: "error" }, 500);
    }) as unknown as typeof fetch;

    render(
      <MemoryRouter initialEntries={["/admin/eventos"]}>
        <RoutesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "+ Crear evento" })).toBeInTheDocument();
    expect(await screen.findByText("Borrador interno")).toBeInTheDocument();
  });
});
