import { render, screen } from "@testing-library/react";

import { EventRegistrationList } from "./EventRegistrationList";
import type { EventRegistrationWithProfile } from "../../types/events";

function registration(
  id: number,
  name: string,
  registrationGroupId: number | null,
  category: "7ma" | "6ta" | null = null,
  waitlistPosition: number | null = null,
): EventRegistrationWithProfile {
  return {
    id,
    event_id: 1,
    user_id: `user-${id}`,
    registration_group_id: registrationGroupId,
    status_code: waitlistPosition == null ? "confirmed" : "waitlisted",
    waitlist_position: waitlistPosition,
    created_at: "2026-09-15T12:00:00.000Z",
    updated_at: "2026-09-15T12:00:00.000Z",
    profile: { id: `user-${id}`, name, avatar_url: null, category },
  };
}

test("shows registrations from the same group in one row", () => {
  render(
    <EventRegistrationList
      registrations={[
        registration(1, "Martín Fiori", 7),
        registration(2, "Adriana Plazomitis", 7),
        registration(3, "Jugador individual", null),
      ]}
    />,
  );

  const pairRow = screen.getByText("Martín Fiori").closest("li");

  expect(pairRow).toContainElement(screen.getByText("Adriana Plazomitis"));
  expect(pairRow).not.toContainElement(screen.getByText("Jugador individual"));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("shows a shared waitlist position and each player's category", () => {
  render(
    <EventRegistrationList
      registrations={[
        registration(1, "Manteca", 8, "7ma", 1),
        registration(2, "Marina Fiori", 8, "6ta", 1),
      ]}
    />,
  );

  const pairRow = screen.getByText("Manteca").closest("li");

  expect(pairRow).toHaveTextContent("1");
  expect(pairRow).toHaveTextContent("Categoría: 7ma");
  expect(pairRow).toHaveTextContent("Categoría: 6ta");
  expect(screen.queryByText(/Posición en espera/)).not.toBeInTheDocument();
});
