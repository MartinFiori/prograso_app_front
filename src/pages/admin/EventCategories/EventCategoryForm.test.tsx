import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import EventCategoryCreatePage from "./EventCategoryCreatePage";
import { supabase } from "../../../utils/supabase";

jest.mock("../../../utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const createdBody = {
  status: "success",
  statusCode: 201,
  description: "OK",
  data: {
    id: 3,
    name: "Cancha abierta",
    description: "Eventos de cancha abierta",
    image_url: "https://i.ibb.co/Mkc39HTJ/prueba.jpg",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
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

describe("EventCategoryForm create", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: { access_token: "test-token" },
      },
      error: null,
    });
    global.fetch = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("submits multipart FormData with the image field", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(createdBody, 201));

    render(
      <MemoryRouter initialEntries={["/admin/categorias/nueva"]}>
        <Routes>
          <Route
            path="/admin/categorias/nueva"
            element={<EventCategoryCreatePage />}
          />
          <Route
            path="/admin/categorias"
            element={<p>listado</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("Nombre"), "Cancha abierta");
    await userEvent.type(
      screen.getByLabelText("Descripción"),
      "Eventos de cancha abierta",
    );

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "prueba.jpg", {
      type: "image/jpeg",
    });
    await userEvent.upload(screen.getByLabelText("Imagen"), file);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    const form = options.body as FormData;
    expect(form.get("name")).toBe("Cancha abierta");
    expect(form.get("image")).toBeInstanceOf(File);
    const headers = new Headers(options.headers);
    expect(headers.get("Content-Type")).not.toBe("application/json");
  });
});
