import { render, screen } from "@testing-library/react";

import AuditLogsPage from "./AuditLogsPage";
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

describe("AuditLogsPage", () => {
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

  test("renders audit rows and pagination", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: [
          {
            id: 1,
            actor_user_id: "11111111-1111-4111-8111-111111111111",
            target_user_id: "22222222-2222-4222-8222-222222222222",
            action: "user_invited",
            reason: null,
            previous_values: null,
            new_values: { email: "ana@example.com" },
            created_at: "2026-09-08T12:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      }),
    );

    render(<AuditLogsPage />);

    expect(await screen.findByRole("heading", { name: "Auditoría" })).toBeInTheDocument();
    expect(await screen.findByText("user_invited")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 1 \(1 registros\)/)).toBeInTheDocument();
  });
});
