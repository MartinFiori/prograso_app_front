import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import LegacyEventRedirect from "./LegacyEventRedirect";
import { supabase } from "../../utils/supabase";

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => ({
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
  }),
}));

jest.mock("../../utils/supabase", () => ({
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

function renderLegacy(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/eventos/:id"
          element={<LegacyEventRedirect />}
        />
        <Route
          path="/event/:category_id/:event_id"
          element={<p>detalle nuevo</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LegacyEventRedirect", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("replaces /eventos/1 with /event/2/1", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      expect(String(input)).toContain("/events/1");
      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: {
          id: 1,
          category_id: 2,
          title: "Encuentro del viernes",
          starts_at: "2026-09-04T21:00:00.000Z",
          registration_deadline: null,
          capacity: 16,
          price: 15000,
          status_code: "open",
          category: { id: 2, name: "Encuentro abierto", image_url: null },
        },
      });
    }) as unknown as typeof fetch;

    renderLegacy("/eventos/1");

    expect(await screen.findByText("detalle nuevo")).toBeInTheDocument();
  });

  test("does not fetch when the legacy id is invalid", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    renderLegacy("/eventos/abc");

    expect(await screen.findByText("Evento no válido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
