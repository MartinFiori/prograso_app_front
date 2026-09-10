import { render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";

import HomeIndex from "./HomeIndex";

jest.mock("./Home", () => {
  return function HomeMock() {
    return <p>catalogo home</p>;
  };
});

function renderHome(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={<HomeIndex />}
        />
        <Route
          path="/auth/callback"
          element={<p>callback oauth</p>}
        />
        <Route
          path="/events"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomeIndex", () => {
  test("shows the catalog without an OAuth code", async () => {
    renderHome("/");

    expect(await screen.findByText("catalogo home")).toBeInTheDocument();
  });

  test("preserves code when sending / to /auth/callback", async () => {
    renderHome("/?code=oauth-placeholder");

    expect(await screen.findByText("callback oauth")).toBeInTheDocument();
    expect(screen.queryByText("catalogo home")).not.toBeInTheDocument();
  });

  test("aliases /events to the catalog", async () => {
    renderHome("/events");

    expect(await screen.findByText("catalogo home")).toBeInTheDocument();
  });
});
