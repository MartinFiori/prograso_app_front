import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SecurityProvider } from "./context/SecurityContext";
import RoutesPage from "./routes/RoutesPage";

test("keeps the auth callback route", async () => {
  const replace = jest.fn();

  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      origin: "http://localhost",
      search: "",
      hash: "",
      replace,
    },
  });

  render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <SecurityProvider>
        <RoutesPage />
      </SecurityProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText("Iniciando sesión...")).toBeInTheDocument();
});
