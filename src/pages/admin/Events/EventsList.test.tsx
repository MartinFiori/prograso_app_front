import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import EventsList from "./EventsList";
import { supabase } from "../../../utils/supabase";

jest.mock("../../../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const eventsBody = {
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
      price: null,
      status_code: "draft",
      created_by: "11111111-1111-4111-8111-111111111111",
      created_at: "2026-09-08T12:00:00.000Z",
      updated_at: "2026-09-08T12:00:00.000Z",
      category: { id: 2, name: "Cancha abierta", image_url: null },
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (status === 204 ? "" : JSON.stringify(body)),
    blob: async () => new Blob(),
  } as Response);
}

describe("EventsList", () => {
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

  test("lists draft events from GET /admin/events", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes("/admin/events")) {
        return jsonResponse(eventsBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    render(
      <MemoryRouter initialEntries={["/admin/eventos"]}>
        <Routes>
          <Route
            path="/admin/eventos"
            element={<EventsList />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Eventos" })).toBeInTheDocument();
    expect(await screen.findByText("Borrador interno")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Crear evento" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Título" })).toBeInTheDocument();
  });
});
