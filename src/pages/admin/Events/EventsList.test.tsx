import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import EventsList from "./EventsList";
import { supabase } from "../../../utils/supabase";

jest.mock("../../../utils/supabase", () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

const events = [
  {
    id: 12, category_id: 2, title: "Borrador interno",
    starts_at: "2026-09-20T21:00:00.000Z", end_at: "2026-09-20T23:00:00.000Z",
    capacity: 16, price: 15000, status_code: "draft",
    created_by: "11111111-1111-4111-8111-111111111111",
    created_at: "2026-09-08T12:00:00.000Z", updated_at: "2026-09-08T12:00:00.000Z",
    registered_count: 1,
    category: { id: 2, name: "Cancha abierta", image_url: null },
  },
  {
    id: 13, category_id: 2, title: "Segundo evento",
    starts_at: "2026-09-21T21:00:00.000Z", end_at: "2026-09-21T23:00:00.000Z",
    capacity: 8, price: 9000, status_code: "published",
    created_by: "11111111-1111-4111-8111-111111111111",
    created_at: "2026-09-08T12:00:00.000Z", updated_at: "2026-09-08T12:00:00.000Z",
    registered_count: 1,
    category: { id: 2, name: "Cancha abierta", image_url: null },
  },
];

const registrations = {
  12: [{
    id: 120, event_id: 12, user_id: "user-ana", status_code: "confirmed",
    waitlist_position: null, has_paid: false,
    created_at: "2026-09-10T12:00:00.000Z", updated_at: "2026-09-10T12:00:00.000Z",
    profile: { id: "user-ana", name: "Ana Gomez", avatar_url: null, role: "user" },
  }],
  13: [{
    id: 130, event_id: 13, user_id: "user-bruno", status_code: "waitlisted",
    waitlist_position: 1, has_paid: true,
    created_at: "2026-09-11T12:00:00.000Z", updated_at: "2026-09-11T12:00:00.000Z",
    profile: { id: "user-bruno", name: "Bruno Perez", avatar_url: null, role: "user" },
  }],
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300, status, headers: new Headers(),
    text: async () => (status === 204 ? "" : JSON.stringify(body)),
    blob: async () => new Blob(),
  } as Response);
}

function success(data: unknown, pagination?: object) {
  return { status: "success", statusCode: 200, description: "OK", data, pagination };
}

function installFetch(options: { paidError?: boolean } = {}) {
  const calls: Array<{ url: string; method: string }> = [];
  const handler = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method });

    if (url.includes("/admin/events?") && method === "GET") {
      return jsonResponse(success(events, { page: 1, limit: 20, total: 2, total_pages: 1 }));
    }
    if (url.includes("/event-categories")) {
      return jsonResponse(success([{ id: 2, name: "Cancha abierta", image_url: null }]));
    }
    if (url.includes("/event-statuses")) {
      return jsonResponse(success([{ code: "draft", label: "Borrador" }, { code: "published", label: "Publicado" }]));
    }
    if (url.includes("/registration-statuses")) {
      return jsonResponse(success([{ code: "confirmed", label: "Confirmado" }, { code: "waitlisted", label: "En espera" }]));
    }
    const rosterMatch = url.match(/\/admin\/events\/(12|13)\/registrations/);
    if (rosterMatch && method === "GET") {
      const eventId = Number(rosterMatch[1]) as 12 | 13;
      return jsonResponse({
        ...success(registrations[eventId], { page: 1, limit: 100, total: 1, total_pages: 1 }),
        meta: { capacity: events.find((event) => event.id === eventId)?.capacity, confirmed_count: eventId === 12 ? 1 : 0, waitlisted_count: eventId === 13 ? 1 : 0 },
      });
    }
    if (url.includes("/admin/users?")) return jsonResponse(success([]));
    if (url.endsWith("/events/12") && method === "PATCH") return jsonResponse(success(events[0]));
    if (url.endsWith("/events/12/registrations/user-ana/paid")) {
      return options.paidError
        ? jsonResponse({ description: "registration_not_found" }, 404)
        : jsonResponse(success({ ...registrations[12][0], has_paid: true }));
    }
    return jsonResponse({ description: `Unhandled ${method} ${url}` }, 404);
  };
  global.fetch = jest.fn(handler) as unknown as typeof fetch;
  return { calls, handler };
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/admin/eventos"]}>
      <Routes><Route path="/admin/eventos" element={<EventsList />} /></Routes>
    </MemoryRouter>,
  );
}

describe("EventsList", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } }, error: null,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => jest.mocked(global.fetch).mockReset());

  test("opens one Ver/editar modal with the selected event form and roster controls", async () => {
    installFetch();
    renderList();

    const triggers = await screen.findAllByRole("button", { name: "Ver/editar" });
    expect(screen.queryByRole("button", { name: "Ver detalles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    await userEvent.click(triggers[0]);

    const dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    expect(within(dialog).getByDisplayValue("Borrador interno")).toBeInTheDocument();
    expect(await within(dialog).findByText("Ana Gomez")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Agregar jugador" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Marcar como pagado" })).toBeInTheDocument();
  });

  test("refreshes a successful edit without closing the management modal", async () => {
    const { calls } = installFetch();
    renderList();
    await userEvent.click((await screen.findAllByRole("button", { name: "Ver/editar" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    await within(dialog).findByText("Ana Gomez");
    await waitFor(() => {
      expect(within(dialog).getByRole("combobox", { name: "Categoría *" })).toHaveValue("2");
    });

    await userEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(calls).toContainEqual(expect.objectContaining({ method: "PATCH" })));
    expect(calls.filter((call) => call.method === "PATCH")).toEqual([
      { url: expect.stringMatching(/\/events\/12$/), method: "PATCH" },
    ]);
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Ver/editar evento" })).toBeInTheDocument();
    expect(await screen.findByText("Evento actualizado.")).toBeInTheDocument();
    expect(calls.filter((call) => call.method === "GET" && call.url.includes("/admin/events?")).length).toBeGreaterThan(1);
  });

  test("keeps roster data unchanged and the modal open when an operation is rejected", async () => {
    installFetch({ paidError: true });
    renderList();
    await userEvent.click((await screen.findAllByRole("button", { name: "Ver/editar" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    await within(dialog).findByText("Ana Gomez");
    await userEvent.click(within(dialog).getByRole("button", { name: "Marcar como pagado" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("registration_not_found");
    expect(within(dialog).getByText("Ana Gomez")).toBeInTheDocument();
    expect(within(dialog).getByText("Pendiente")).toBeInTheDocument();
  });

  test("refreshes the table after a roster change and closes by button with focus restoration", async () => {
    const { calls } = installFetch();
    renderList();
    const trigger = (await screen.findAllByRole("button", { name: "Ver/editar" }))[0];
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    await within(dialog).findByText("Ana Gomez");

    await userEvent.click(within(dialog).getByRole("button", { name: "Marcar como pagado" }));

    expect(await within(dialog).findByText("Pago actualizado.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Ver/editar evento" })).toBeInTheDocument();
    expect(calls.filter((call) => call.method === "GET" && call.url.includes("/admin/events?")).length).toBeGreaterThan(1);

    await userEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog", { name: "Ver/editar evento" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test("closes with Escape, restores focus, and clears roster state for the next event", async () => {
    installFetch();
    renderList();
    const triggers = await screen.findAllByRole("button", { name: "Ver/editar" });
    await userEvent.click(triggers[0]);
    let dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    await within(dialog).findByText("Ana Gomez");
    await userEvent.type(within(dialog).getByPlaceholderText("Buscar por nombre o correo"), "Ana");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Ver/editar evento" })).not.toBeInTheDocument();
    expect(triggers[0]).toHaveFocus();

    await userEvent.click(triggers[1]);
    dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    expect(await within(dialog).findByText("Bruno Perez")).toBeInTheDocument();
    expect(within(dialog).queryByText("Ana Gomez")).not.toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("Buscar por nombre o correo")).toHaveValue("");
  });

  test("ignores a late roster response after closing and opening another event", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    const firstRoster = new Promise<Response>((resolve) => { resolveFirst = resolve; });
    const { handler } = installFetch();
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/admin/events/12/registrations")) return firstRoster;
      return handler(input, init);
    }) as unknown as typeof fetch;
    renderList();

    const triggers = await screen.findAllByRole("button", { name: "Ver/editar" });
    await userEvent.click(triggers[0]);
    await screen.findByRole("dialog", { name: "Ver/editar evento" });
    await userEvent.keyboard("{Escape}");
    await userEvent.click(triggers[1]);
    const dialog = await screen.findByRole("dialog", { name: "Ver/editar evento" });
    expect(await within(dialog).findByText("Bruno Perez")).toBeInTheDocument();

    resolveFirst?.(await jsonResponse({
      ...success(registrations[12], { page: 1, limit: 100, total: 1, total_pages: 1 }),
      meta: { capacity: 16, confirmed_count: 1, waitlisted_count: 0 },
    }));
    await waitFor(() => expect(within(dialog).queryByText("Ana Gomez")).not.toBeInTheDocument());
  });
});
