import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AdminLayout, { ADMIN_TABS } from "./AdminLayout";

function renderLayout(path = "/admin/categorias") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            path="categorias"
            element={<p>categorías panel</p>}
          />
          <Route
            path="eventos"
            element={<p>eventos panel</p>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  test("renders the seven backoffice tabs and no Exercises tab", () => {
    renderLayout();

    const nav = screen.getByRole("navigation", { name: "Backoffice" });
    expect(nav).toBeInTheDocument();

    for (const tab of ADMIN_TABS) {
      expect(screen.getByRole("link", { name: tab.label })).toBeInTheDocument();
    }

    expect(ADMIN_TABS).toHaveLength(7);
    expect(screen.queryByRole("link", { name: /exercises/i })).not.toBeInTheDocument();
  });

  test("marks the active tab from the current route", () => {
    renderLayout("/admin/eventos");

    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Categorías" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
