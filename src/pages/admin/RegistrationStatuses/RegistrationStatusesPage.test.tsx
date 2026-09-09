import { render, screen } from "@testing-library/react";

import RegistrationStatusesPage from "./RegistrationStatusesPage";

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
    blob: async () => new Blob(),
  } as Response);
}

describe("RegistrationStatusesPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.mocked(global.fetch).mockReset();
  });

  test("shows empty catalog message for data []", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({
        status: "success",
        statusCode: 200,
        description: "OK",
        data: [],
      }),
    );

    render(<RegistrationStatusesPage />);

    expect(
      await screen.findByText("No hay estados de inscripción."),
    ).toBeInTheDocument();
  });
});
