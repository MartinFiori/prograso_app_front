import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EventMembershipCta } from "./EventMembershipCta";
import { useEventMembership } from "../../hooks/useEventMembership";
import { useConnection } from "../../hooks/useConnection";

jest.mock("../../hooks/useEventMembership");
jest.mock("../../hooks/useConnection");

const join = jest.fn();
const leave = jest.fn();
const connection = jest.fn();

describe("EventMembershipCta pair registration", () => {
  beforeEach(() => {
    join.mockReset().mockResolvedValue(true);
    leave.mockReset();
    connection.mockReset().mockResolvedValue({
      status: "success",
      statusCode: 200,
      description: "OK",
      data: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Ana Compañera",
          avatar_url: null,
        },
      ],
    });

    jest.mocked(useConnection).mockReturnValue(connection);
    jest.mocked(useEventMembership).mockReturnValue({
      state: { status: "not-joined" },
      inFlight: false,
      join,
      leave,
      reload: jest.fn(),
    });
  });

  test("searches and submits the selected registered companion", async () => {
    render(
      <EventMembershipCta
        eventId={9}
        participantsPerRegistration={2}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Anotarme con compañero" }),
    );
    await userEvent.type(screen.getByLabelText("Buscar por nombre"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Ana Compañera")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Ana Compañera/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar pareja" }),
    );

    await waitFor(() => {
      expect(join).toHaveBeenCalledWith(
        "22222222-2222-4222-8222-222222222222",
      );
    });
  });

  test("shows no-results feedback only after submitting a search", async () => {
    connection.mockResolvedValueOnce({
      status: "success",
      statusCode: 200,
      description: "OK",
      data: [],
    });

    render(
      <EventMembershipCta
        eventId={9}
        participantsPerRegistration={2}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Anotarme con compañero" }),
    );
    await userEvent.type(screen.getByLabelText("Buscar por nombre"), "Marina");

    expect(
      screen.queryByText("No encontramos jugadores con ese nombre."),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(
      await screen.findByText("No encontramos jugadores con ese nombre."),
    ).toBeInTheDocument();
  });
});
