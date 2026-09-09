import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";

import Home from "./Home";
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

const categoriesBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [
    {
      id: 2,
      name: "Encuentro abierto",
      description: "Juego social",
      image_url: "https://example.com/category.jpg",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: 3,
      name: "Torneo",
      description: null,
      image_url: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
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

function CategoryProbe() {
  const { category_id } = useParams();
  return <p>{`categoria ${category_id}`}</p>;
}

function renderHome(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/event/:category_id"
          element={<CategoryProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Home", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads categories on mount and does not fetch events", async () => {
    const fetchMock = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBeNull();
      const url = String(input);

      if (url.includes("/event-categories")) {
        return jsonResponse(categoriesBody);
      }

      return jsonResponse({ status: "error" }, 500);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    renderHome();

    expect(await screen.findByRole("heading", { name: "Encuentro abierto" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Eventos" })).toBeInTheDocument();
    expect(screen.getByText("Juego social")).toBeInTheDocument();
    expect(screen.queryByLabelText("Categoría")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Estado")).not.toBeInTheDocument();
    expect(screen.queryByText("Todos")).not.toBeInTheDocument();
    expect(screen.queryByText("Gratis")).not.toBeInTheDocument();

    const eventListCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/events"),
    );
    expect(eventListCalls).toHaveLength(0);
  });

  test("navigates to /event/2 from a category card", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/event-categories")) {
        return jsonResponse(categoriesBody);
      }

      return jsonResponse({ status: "error" }, 500);
    }) as unknown as typeof fetch;

    renderHome();

    await userEvent.click(
      await screen.findByRole("link", { name: "Ver eventos de Encuentro abierto" }),
    );

    expect(await screen.findByText("categoria 2")).toBeInTheDocument();
  });

  test("shows a recoverable error when categories fail", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Failed to fetch"))) as unknown as typeof fetch;

    renderHome();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByText("No hay categorías disponibles.")).not.toBeInTheDocument();
  });
});
