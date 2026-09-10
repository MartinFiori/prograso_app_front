import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CategoryEvents from "./CategoryEvents";
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

const category = {
  id: 2,
  name: "Encuentro abierto",
  description: "Juego social",
  image_url: "https://example.com/category.jpg",
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const publicEvent = {
  id: 1,
  category_id: 2,
  title: "Encuentro del viernes",
  starts_at: "2026-09-04T21:00:00.000Z",
  registration_deadline: "2026-09-04T18:00:00.000Z",
  capacity: 16,
  price: 15000,
  status_code: "open",
  category: {
    id: 2,
    name: "Encuentro abierto",
    image_url: "https://example.com/category.jpg",
  },
};

const otherCategoryEvent = {
  ...publicEvent,
  id: 9,
  category_id: 3,
  title: "Evento de otra categoría",
};

const statusesBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [
    { code: "open", label: "Inscripciones abiertas", description: null },
  ],
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
    blob: async () => new Blob(),
  } as Response);
}

function renderCategory(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/event/:category_id/:event_id"
          element={<p>detalle</p>}
        />
        <Route
          path="/event/:category_id"
          element={<CategoryEvents />}
        />
        <Route
          path="/"
          element={<p>inicio</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function mockCategoryFetch(options?: {
  events?: unknown[];
  categoryStatus?: number;
  eventsNetworkError?: boolean;
}) {
  const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBeNull();

    if (/\/event-categories\/\d+/.test(url)) {
      if (options?.categoryStatus === 404) {
        return jsonResponse(
          {
            status: "error",
            statusCode: 404,
            description: "Category not found",
            errorCode: "ENTITY_NOT_FOUND",
            data: null,
          },
          404,
        );
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: category,
      });
    }

    if (url.includes("/event-statuses")) {
      return jsonResponse(statusesBody);
    }

    if (url.includes("/events?")) {
      if (options?.eventsNetworkError) {
        return Promise.reject(new Error("Failed to fetch"));
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: options?.events ?? [publicEvent],
        pagination: {
          page: 1,
          limit: 20,
          total: (options?.events ?? [publicEvent]).length,
          total_pages: 1,
        },
      });
    }

    return jsonResponse({ status: "error" }, 500);
  });

  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("CategoryEvents", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads the category header and events filtered by category_id", async () => {
    const fetchMock = mockCategoryFetch();
    renderCategory("/event/2");

    expect(await screen.findByRole("heading", { name: "Encuentro del viernes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Encuentro abierto" })).toBeInTheDocument();
    expect(screen.getByText("Cupo máximo: 16")).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.queryByText("Todos")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Estado")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/event-categories/2"),
        expect.anything(),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("category_id=2"),
        expect.anything(),
      );
    });
  });

  test("does not keep an event from another category in the list", async () => {
    mockCategoryFetch({ events: [publicEvent, otherCategoryEvent] });
    renderCategory("/event/2");

    expect(await screen.findByText("Encuentro del viernes")).toBeInTheDocument();
    expect(screen.queryByText(otherCategoryEvent.title)).not.toBeInTheDocument();
  });

  test("shows empty copy and a link home when the category has no events", async () => {
    mockCategoryFetch({ events: [] });
    renderCategory("/event/2");

    expect(
      await screen.findByText("No hay eventos disponibles para esta categoría."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Encuentro abierto" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Volver a categorías" }).length).toBeGreaterThan(0);
  });

  test("renders NotFound when the category does not exist", async () => {
    mockCategoryFetch({ categoryStatus: 404 });
    renderCategory("/event/99");

    expect(await screen.findByText("Pelota fuera de juego")).toBeInTheDocument();
  });

  test("does not fetch when the category id is invalid", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    renderCategory("/event/abc");

    expect(await screen.findByText("Categoría no válida")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("shows formatted price and does not invent Gratis", async () => {
    mockCategoryFetch({
      events: [{ ...publicEvent, price: 15000 }],
    });
    renderCategory("/event/2");

    expect(await screen.findByText("Encuentro del viernes")).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.queryByText("Gratis")).not.toBeInTheDocument();
  });

  test("navigates to the event detail path", async () => {
    mockCategoryFetch();
    renderCategory("/event/2");

    await userEvent.click(
      await screen.findByRole("heading", { name: "Encuentro del viernes" }),
    );

    expect(await screen.findByText("detalle")).toBeInTheDocument();
  });
});
