import { render, screen, waitFor, within } from "@testing-library/react";
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

const anaId = "11111111-1111-4111-8111-111111111111";
const nuevoId = "44444444-4444-4444-8444-444444444444";

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
      price: 15000,
      status_code: "open",
      created_by: anaId,
      created_at: "2026-09-08T12:00:00.000Z",
      updated_at: "2026-09-08T12:00:00.000Z",
      category: { id: 2, name: "Cancha", image_url: null },
    },
    {
      id: 5,
      category_id: 2,
      title: "Torneo sabado",
      starts_at: "2026-09-21T21:00:00.000Z",
      registration_deadline: null,
      capacity: 8,
      price: 10000,
      status_code: "closed",
      created_by: anaId,
      created_at: "2026-09-08T12:00:00.000Z",
      updated_at: "2026-09-08T12:00:00.000Z",
      category: { id: 2, name: "Cancha", image_url: null },
    },
  ],
  pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
};

const anaRegistration = {
  id: 12,
  event_id: 4,
  user_id: anaId,
  status_code: "confirmed",
  waitlist_position: null,
  created_at: "2026-09-04T18:00:00.000Z",
  updated_at: "2026-09-04T18:00:00.000Z",
  profile: {
    id: anaId,
    name: "Ana Gomez",
    avatar_url: null,
    role: "user",
  },
};

const waitlistedRegistration = {
  id: 13,
  event_id: 4,
  user_id: "22222222-2222-4222-8222-222222222222",
  status_code: "waitlisted",
  waitlist_position: 1,
  created_at: "2026-09-05T18:00:00.000Z",
  updated_at: "2026-09-05T18:00:00.000Z",
  profile: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Bruno Perez",
    avatar_url: null,
    role: "user",
  },
};

const registrationsBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [anaRegistration, waitlistedRegistration],
  pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
  meta: { capacity: 16, confirmed_count: 1, waitlisted_count: 1 },
};

const emptyRegistrationsBody = {
  status: "success",
  statusCode: 200,
  description: "OK",
  data: [],
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  meta: { capacity: 8, confirmed_count: 0, waitlisted_count: 0 },
};

const anaUser = {
  id: anaId,
  email: "ana@example.com",
  name: "Ana Gomez",
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
};

const nuevoUser = {
  ...anaUser,
  id: nuevoId,
  email: "nuevo@example.com",
  name: "Nuevo",
};

function usersBody(data: unknown[]) {
  return {
    status: "success",
    statusCode: 200,
    description: "OK",
    data,
    pagination: { page: 1, limit: 100, total: data.length, total_pages: 1 },
  };
}

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin/inscripciones"
          element={<RegistrationsPage />}
        />
        <Route
          path="/admin/inscripciones/:eventId"
          element={<RegistrationsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function installFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  ) as jest.Mock;
}

function defaultHandler(options: {
  registrationsFor4?: typeof registrationsBody;
  postDelayMs?: number;
  onPost?: (body: string | undefined) => void;
  onDelete?: (url: string) => void;
  onPatch?: (body: string | undefined) => void;
} = {}) {
  const registrationsFor4 = options.registrationsFor4 ?? registrationsBody;

  return (url: string, init?: RequestInit) => {
    const href = String(url);
    const method = init?.method ?? "GET";

    if (href.includes("/event-statuses")) {
      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: [
          { code: "open", label: "Abierto", description: null },
          { code: "closed", label: "Cerrado", description: null },
        ],
      });
    }

    if (href.includes("/registration-statuses")) {
      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: [
          { code: "confirmed", label: "Confirmada", description: null },
          { code: "waitlisted", label: "En espera", description: null },
        ],
      });
    }

    if (href.includes("/admin/events/4/registrations") && method === "POST") {
      options.onPost?.(typeof init?.body === "string" ? init.body : undefined);
      const response = jsonResponse(
        {
          status: "success",
          statusCode: 201,
          description: "OK",
          data: anaRegistration,
        },
        201,
      );

      if (options.postDelayMs) {
        return new Promise((resolve) => {
          setTimeout(() => {
            void response.then(resolve);
          }, options.postDelayMs);
        });
      }

      return response;
    }

    if (href.includes("/admin/events/4/registrations")) {
      return jsonResponse(registrationsFor4);
    }

    if (href.includes("/admin/events/5/registrations")) {
      return jsonResponse(emptyRegistrationsBody);
    }

    if (href.includes("/admin/event-registrations/") && method === "DELETE") {
      options.onDelete?.(href);
      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: anaRegistration,
      });
    }

    if (href.includes("/admin/event-registrations/") && method === "PATCH") {
      options.onPatch?.(typeof init?.body === "string" ? init.body : undefined);
      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: { ...anaRegistration, status_code: "waitlisted", waitlist_position: 2 },
      });
    }

    if (href.includes("/admin/users?") || /\/admin\/users$/.test(href.split("?")[0] ?? "")) {
      return jsonResponse(usersBody([anaUser, nuevoUser]));
    }

    if (href.includes("/admin/events")) {
      return jsonResponse(eventsBody);
    }

    return jsonResponse({ status: "error" }, 404);
  };
}

describe("RegistrationsPage", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("loads events, registrations, metrics and waitlist dash", async () => {
    installFetch(defaultHandler());
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    expect(screen.getByText("Bruno Perez")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Cupo")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("Confirmados")).toBeInTheDocument();
    expect(screen.getByText("2 jugadores en este evento")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getAllByText("En espera").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Agregar jugador" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "+ Crear inscripción" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar conjunto" }),
    ).not.toBeInTheDocument();
  });

  test("disables add when no event is selected", async () => {
    installFetch(defaultHandler());
    renderPage("/admin/inscripciones");

    expect(
      await screen.findByText("Elegí un evento para ver los jugadores inscriptos."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar jugador" }),
    ).toBeDisabled();
  });

  test("changes event, updates the URL and hides previous roster", async () => {
    installFetch(defaultHandler());
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Evento"), "5");

    expect(
      await screen.findByText("No hay jugadores inscriptos en este evento."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ana Gomez")).not.toBeInTheDocument();
    expect(screen.getByText("0 jugadores en este evento")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/events\/5\/registrations/),
      expect.anything(),
    );
  });

  test("filters the selected event roster by name or email", async () => {
    installFetch(defaultHandler());
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Bruno Perez")).toBeInTheDocument();
    await userEvent.type(
      screen.getByPlaceholderText("Buscar por nombre o correo"),
      "ana@",
    );

    expect(screen.getByText("Ana Gomez")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Perez")).not.toBeInTheDocument();

    await userEvent.clear(
      screen.getByPlaceholderText("Buscar por nombre o correo"),
    );
    await userEvent.type(
      screen.getByPlaceholderText("Buscar por nombre o correo"),
      "zzz",
    );

    expect(
      screen.getByText("No hay resultados para esa búsqueda."),
    ).toBeInTheDocument();
  });

  test("opens add modal, excludes registered users, posts user_id and can cancel", async () => {
    let postCount = 0;
    installFetch(
      defaultHandler({
        onPost: () => {
          postCount += 1;
        },
      }),
    );
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Agregar jugador" }));

    expect(
      await screen.findByText("Seleccioná un usuario para agregarlo a Encuentro del viernes."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Nuevo")).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).queryByText("Ana Gomez"),
    ).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/users\?.*limit=100/),
      expect.anything(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByText("Seleccioná un usuario para agregarlo a Encuentro del viernes."),
    ).not.toBeInTheDocument();
    expect(postCount).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "Agregar jugador" }));
    expect(await screen.findByText("Nuevo")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Nuevo"));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Agregar jugador",
      }),
    );

    await waitFor(() => {
      expect(postCount).toBe(1);
    });
    expect(
      (global.fetch as jest.Mock).mock.calls.some(
        (call) =>
          call[1]?.method === "POST" &&
          call[1]?.body === JSON.stringify({ user_id: nuevoId }),
      ),
    ).toBe(true);
    expect(await screen.findByText("Jugador agregado.")).toBeInTheDocument();
  });

  test("prevents a second POST while the first add is in flight", async () => {
    let postCount = 0;
    installFetch(
      defaultHandler({
        postDelayMs: 80,
        onPost: () => {
          postCount += 1;
        },
      }),
    );
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Agregar jugador" }));
    expect(await screen.findByText("Nuevo")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Nuevo"));

    const submit = within(screen.getByRole("dialog")).getByRole("button", {
      name: "Agregar jugador",
    });
    await userEvent.click(submit);
    await userEvent.click(submit);

    await waitFor(() => {
      expect(postCount).toBe(1);
    });
  });

  test("shows registration details and PATCHes from edit", async () => {
    let patchBody: string | undefined;
    installFetch(
      defaultHandler({
        onPatch: (body) => {
          patchBody = body;
        },
      }),
    );
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ana Gomez")).toBeInTheDocument();
    expect(within(dialog).getByText("ana@example.com")).toBeInTheDocument();
    expect(within(dialog).getByText(anaId)).toBeInTheDocument();
    expect(within(dialog).getByText("Encuentro del viernes")).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Editar inscripción" }),
    );
    await userEvent.selectOptions(screen.getByLabelText("Estado"), "waitlisted");
    await userEvent.type(screen.getByLabelText("Posición en lista de espera"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(patchBody).toBe(
        JSON.stringify({ status_code: "waitlisted", waitlist_position: 2 }),
      );
    });
  });

  test("asks for confirmation before DELETE and reloads the roster", async () => {
    let deleted = false;
    let listCalls = 0;
    installFetch((url, init) => {
      const href = String(url);
      if (href.includes("/admin/events/4/registrations") && (!init?.method || init.method === "GET")) {
        listCalls += 1;
      }
      return defaultHandler({
        onDelete: () => {
          deleted = true;
        },
      })(url, init);
    });
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    const beforeDelete = listCalls;
    await userEvent.click(
      screen.getAllByRole("button", { name: "Quitar del evento" })[0],
    );
    expect(
      await screen.findByText("¿Querés quitar a Ana Gomez de Encuentro del viernes?"),
    ).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Quitar del evento",
      }),
    );

    await waitFor(() => {
      expect(deleted).toBe(true);
    });
    await waitFor(() => {
      expect(listCalls).toBeGreaterThan(beforeDelete);
    });
    expect(await screen.findByText("Jugador quitado del evento.")).toBeInTheDocument();
  });

  test("shows a retry state when registrations fail", async () => {
    installFetch((url, init) => {
      const href = String(url);
      if (href.includes("/admin/events/4/registrations")) {
        return jsonResponse(
          {
            status: "error",
            statusCode: 500,
            description: "Unexpected error",
            errorCode: "UNEXPECTED_ERROR",
            data: null,
          },
          500,
        );
      }
      return defaultHandler()(url, init);
    });
    renderPage("/admin/inscripciones/4");

    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("paginates a large roster without PUT", async () => {
    const members = Array.from({ length: 25 }, (_, index) => {
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

    installFetch((url, init) => {
      const href = String(url);
      const method = init?.method ?? "GET";

      if (href.includes("/admin/events/4/registrations") && method === "GET") {
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
          meta: { capacity: 40, confirmed_count: 25, waitlisted_count: 0 },
        });
      }

      return defaultHandler()(url, init);
    });

    renderPage("/admin/inscripciones/4");

    expect(await screen.findByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 20")).toBeInTheDocument();
    expect(screen.queryByText("User 21")).not.toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2 \(25 jugadores\)/)).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) => call[1]?.method === "PUT"),
    ).toBe(false);
  });
});
