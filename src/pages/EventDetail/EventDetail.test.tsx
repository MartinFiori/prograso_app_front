import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import EventDetail from "./EventDetail";
import { supabase } from "../../utils/supabase";

const mockSecurity: {
  login: jest.Mock;
  logout: jest.Mock;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: { id: string } | null;
  loading: boolean;
  profile: null;
  profileLoading: boolean;
  loadSession: jest.Mock;
  setUser: jest.Mock;
} = {
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

jest.mock("../../context/SecurityContext", () => ({
  useSecurity: () => mockSecurity,
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

const confirmedRegistration = {
  id: 10,
  event_id: 1,
  user_id: "7a93c6a8-0000-0000-0000-000000000000",
  status_code: "confirmed",
  waitlist_position: null,
  created_at: "2026-09-04T18:00:00.000Z",
  updated_at: "2026-09-04T18:00:00.000Z",
  profile: {
    id: "7a93c6a8-0000-0000-0000-000000000000",
    name: "Ana Gomez",
    avatar_url: "https://example.com/avatar.jpg",
  },
};

const waitlistedRegistration = {
  id: 11,
  event_id: 1,
  user_id: "8b84d7b9-0000-0000-0000-000000000000",
  status_code: "waitlisted",
  waitlist_position: 1,
  created_at: "2026-09-04T18:00:00.000Z",
  updated_at: "2026-09-04T18:00:00.000Z",
  profile: {
    id: "8b84d7b9-0000-0000-0000-000000000000",
    name: "Luis Perez",
    avatar_url: null,
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

function renderDetail(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/event/:category_id/:event_id"
          element={<EventDetail />}
        />
        <Route
          path="/event/:category_id"
          element={<p>listado categoria</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function statusesResponse() {
  return jsonResponse({
    status: "success",
    statusCode: 200,
    description: "OK",
    data: [{ code: "open", label: "Inscripciones abiertas", description: null }],
  });
}

function emptyRegistrationsResponse() {
  return jsonResponse({
    status: "success",
    statusCode: 200,
    description: "OK",
    data: [],
    pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  });
}

function meMissingResponse() {
  return jsonResponse(
    {
      status: "error",
      statusCode: 404,
      description: "Registration not found",
      errorCode: "registration_not_found",
      data: null,
    },
    404,
  );
}

describe("EventDetail", () => {
  beforeEach(() => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockSecurity.isAuthenticated = false;
    mockSecurity.user = null;
    mockSecurity.login.mockReset();
  });

  test("shows public fields and not created_by", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBeNull();
      const url = String(input);

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations")) {
        return emptyRegistrationsResponse();
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");

    expect(await screen.findByRole("heading", { name: "Encuentro del viernes" })).toBeInTheDocument();
    expect(screen.getAllByText("Encuentro abierto").length).toBeGreaterThan(0);
    expect(screen.getByText("Cupo máximo: 16")).toBeInTheDocument();
    expect(screen.getByText("Inscripciones abiertas")).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/created_by/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a Encuentro abierto" })).toHaveAttribute(
      "href",
      "/event/2",
    );
    expect(screen.getByRole("heading", { name: "Usuarios registrados" })).toBeInTheDocument();
    expect(screen.getByText("0 de 16")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anotarme" })).toBeInTheDocument();
  });

  test("splits confirmed and waitlisted roster and shows occupancy", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations")) {
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: [confirmedRegistration, waitlistedRegistration],
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        });
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");

    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    expect(screen.getByText("1 de 16")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lista de espera" })).toBeInTheDocument();
    expect(screen.getByText("Luis Perez")).toBeInTheDocument();
    expect(screen.getByText("Posición en espera: 1")).toBeInTheDocument();

    const confirmedRow = screen.getByText("Ana Gomez").closest("li");
    expect(confirmedRow).not.toHaveTextContent("Posición en espera");
    expect(confirmedRow).toHaveTextContent("1");
  });

  test("shows NotFound for event_not_found", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      return jsonResponse(
        {
          status: "error",
          statusCode: 404,
          description: "Event not found",
          errorCode: "event_not_found",
          data: null,
        },
        404,
      );
    }) as unknown as typeof fetch;

    renderDetail("/event/2/99");

    expect(await screen.findByText("Pelota fuera de juego")).toBeInTheDocument();
  });

  test("shows NotFound when the event does not belong to the category", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations")) {
        return emptyRegistrationsResponse();
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/3/1");

    expect(await screen.findByText("Pelota fuera de juego")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Encuentro del viernes" })).not.toBeInTheDocument();
  });

  test("does not fetch when the id is invalid", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDetail("/event/2/abc");

    expect(await screen.findByText("Evento no válido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("does not fetch when the category id is invalid", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDetail("/event/0/1");

    expect(await screen.findByText("Evento no válido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("hydrates not joined as Anotarme", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { id: "11111111-1111-4111-8111-111111111111" };

    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations/me")) {
        return meMissingResponse();
      }

      if (url.includes("/registrations")) {
        return emptyRegistrationsResponse();
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");

    expect(await screen.findByRole("button", { name: "Anotarme" })).toBeInTheDocument();
  });

  test("joins with POST without user_id and refetches the roster", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { id: "11111111-1111-4111-8111-111111111111" };
    let rosterGets = 0;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations/me") && method === "GET") {
        return meMissingResponse();
      }

      if (url.includes("/registrations") && method === "POST") {
        expect(init?.body).toBe("{}");
        expect(String(init?.body)).not.toContain("user_id");
        return jsonResponse(
          {
            status: "success",
            statusCode: 201,
            description: "OK",
            data: {
              id: 99,
              event_id: 1,
              user_id: mockSecurity.user?.id,
              status_code: "confirmed",
              waitlist_position: null,
              created_at: "2026-09-04T18:00:00.000Z",
              updated_at: "2026-09-04T18:00:00.000Z",
            },
          },
          201,
        );
      }

      if (url.includes("/registrations")) {
        rosterGets += 1;
        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: rosterGets > 1 ? [confirmedRegistration] : [],
          pagination: {
            page: 1,
            limit: 20,
            total: rosterGets > 1 ? 1 : 0,
            total_pages: 1,
          },
        });
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");
    await userEvent.click(await screen.findByRole("button", { name: "Anotarme" }));

    expect(await screen.findByText("Inscripto")).toBeInTheDocument();
    expect(await screen.findByText("Ana Gomez")).toBeInTheDocument();
    expect(await screen.findByText("1 de 16")).toBeInTheDocument();
    expect(rosterGets).toBeGreaterThan(1);
  });

  test("recovers 409 by GET /me without retrying POST", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { id: "11111111-1111-4111-8111-111111111111" };
    let postCount = 0;
    let meCount = 0;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations/me")) {
        meCount += 1;
        if (meCount === 1) {
          return meMissingResponse();
        }

        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: {
            id: 12,
            event_id: 1,
            user_id: mockSecurity.user?.id,
            status_code: "confirmed",
            waitlist_position: null,
            created_at: "2026-09-04T18:00:00.000Z",
            updated_at: "2026-09-04T18:00:00.000Z",
          },
        });
      }

      if (url.includes("/registrations") && method === "POST") {
        postCount += 1;
        return jsonResponse(
          {
            status: "error",
            statusCode: 409,
            description: "The user is already registered for this event",
            errorCode: "registration_already_exists",
            data: null,
          },
          409,
        );
      }

      if (url.includes("/registrations")) {
        return emptyRegistrationsResponse();
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");
    await userEvent.click(await screen.findByRole("button", { name: "Anotarme" }));

    expect(await screen.findByText("Inscripto")).toBeInTheDocument();
    expect(postCount).toBe(1);
    expect(meCount).toBeGreaterThan(1);
  });

  test.each([
    ["event_registration_forbidden", 403],
    ["event_not_open", 409],
    ["registration_deadline_expired", 409],
  ] as const)(
    "surfaces %s from join POST without retrying POST",
    async (errorCode, status) => {
      mockSecurity.isAuthenticated = true;
      mockSecurity.user = { id: "11111111-1111-4111-8111-111111111111" };
      let postCount = 0;
      let meCount = 0;

      global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.includes("/event-statuses")) {
          return statusesResponse();
        }

        if (url.includes("/registrations/me")) {
          meCount += 1;
          return meMissingResponse();
        }

        if (url.includes("/registrations") && method === "POST") {
          postCount += 1;
          return jsonResponse(
            {
              status: "error",
              statusCode: status,
              description: errorCode,
              errorCode,
              data:
                errorCode === "event_registration_forbidden"
                  ? { blocked_until: null }
                  : null,
            },
            status,
          );
        }

        if (url.includes("/registrations")) {
          return emptyRegistrationsResponse();
        }

        return jsonResponse({
          status: "success",
          statusCode: 200,
          description: "OK",
          data: publicEvent,
        });
      }) as unknown as typeof fetch;

      renderDetail("/event/2/1");
      await userEvent.click(await screen.findByRole("button", { name: "Anotarme" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(errorCode);
      expect(postCount).toBe(1);
      expect(meCount).toBe(1);
    },
  );

  test("disables join while the request is in flight", async () => {
    mockSecurity.isAuthenticated = true;
    mockSecurity.user = { id: "11111111-1111-4111-8111-111111111111" };
    let resolvePost: ((value: Response) => void) | undefined;

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/event-statuses")) {
        return statusesResponse();
      }

      if (url.includes("/registrations/me")) {
        return meMissingResponse();
      }

      if (url.includes("/registrations") && method === "POST") {
        return new Promise<Response>((resolve) => {
          resolvePost = resolve;
        });
      }

      if (url.includes("/registrations")) {
        return emptyRegistrationsResponse();
      }

      return jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: publicEvent,
      });
    }) as unknown as typeof fetch;

    renderDetail("/event/2/1");
    const joinButton = await screen.findByRole("button", { name: "Anotarme" });
    await userEvent.click(joinButton);

    expect(joinButton).toBeDisabled();

    await waitFor(() => {
      expect(resolvePost).toBeDefined();
    });

    resolvePost?.(
      (await jsonResponse(
        {
          status: "success",
          statusCode: 201,
          description: "OK",
          data: {
            id: 12,
            event_id: 1,
            user_id: mockSecurity.user?.id,
            status_code: "confirmed",
            waitlist_position: null,
            created_at: "2026-09-04T18:00:00.000Z",
            updated_at: "2026-09-04T18:00:00.000Z",
          },
        },
        201,
      )) as Response,
    );

    expect(await screen.findByText("Inscripto")).toBeInTheDocument();
  });
});
