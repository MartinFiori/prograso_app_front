import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import EventCategoriesList from "./EventCategoriesList";
import { supabase } from "../../../utils/supabase";

jest.mock("../../../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
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
      description: "Eventos abiertos",
      image_url: "https://i.ibb.co/Mkc39HTJ/prueba.jpg",
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
    text: async () => (status === 204 ? "" : JSON.stringify(body)),
    blob: async () => new Blob(),
  } as Response);
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/admin/categorias"]}>
      <Routes>
        <Route
          path="/admin/categorias"
          element={<EventCategoriesList />}
        />
        <Route
          path="/admin/categorias/nueva"
          element={<p>nueva</p>}
        />
        <Route
          path="/admin/categorias/:id/editar"
          element={<p>editar</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EventCategoriesList", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: { access_token: "test-token" },
      },
      error: null,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("shows active categories for the admin list", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes("/event-categories")) {
        return jsonResponse(categoriesBody);
      }

      return jsonResponse({ status: "error" }, 404);
    });

    renderList();

    expect(
      await screen.findByRole("heading", { name: "Categorías" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Encuentro abierto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva categoría" })).toBeInTheDocument();
  });

  test("sends DELETE without JSON content-type", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === "DELETE") {
        return jsonResponse(null, 204);
      }

      return jsonResponse(categoriesBody);
    });

    renderList();
    await screen.findByText("Encuentro abierto");

    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      const deleteCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1]?.method === "DELETE",
      );
      expect(deleteCall).toBeDefined();
      const headers = new Headers(deleteCall?.[1]?.headers);
      expect(headers.get("Content-Type")).not.toBe("application/json");
    });
  });
});
