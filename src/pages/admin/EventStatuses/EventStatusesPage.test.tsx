import { render, screen } from "@testing-library/react";

import EventStatusesPage from "./EventStatusesPage";

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
    blob: async () => new Blob(),
  } as Response);
}

describe("EventStatusesPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("shows empty catalog message instead of 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: [],
      }),
    );

    render(<EventStatusesPage />);

    expect(
      await screen.findByText("No hay estados de evento."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/404/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Crear/ })).not.toBeInTheDocument();
  });
});
